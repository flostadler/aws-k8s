
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export interface BuildkitBuilderArgs {
    caCertPem: pulumi.Input<string>;
    certPem: pulumi.Input<string>;
    privateKeyPem: pulumi.Input<string>;
    replicas?: pulumi.Input<number>;
    namespace?: pulumi.Input<string>;
    pvConfig?: pulumi.Input<PvConfig>;
    bottlerocket?: pulumi.Input<boolean>;
    nodeSelector?: pulumi.Input<{[key: string]: pulumi.Input<string>}>;
    tolerations?: pulumi.Input<k8s.types.input.core.v1.Toleration[]>;
    resources?: pulumi.Input<k8s.types.input.core.v1.ResourceRequirements>;
}

export interface PvConfig {
    storageClass: string;
    size: string;
}

export class BuildkitBuilder extends pulumi.ComponentResource {
    constructor(name: string, args: BuildkitBuilderArgs, opts?: pulumi.ComponentResourceOptions) {
        super("aws-k8s:buildkit:Builder", name, args, opts);

    // Create a Kubernetes namespace for buildkit resources
    const namespace = args.namespace ?? "default"; // Using default namespace

    // Create a secret for buildkit certificates
    const certSecret = new k8s.core.v1.Secret(`${name}-buildkit-certs`, {
      metadata: {
        name: `${name}-buildkit-certs`,
        namespace: namespace,
      },
      stringData: {
        "ca.pem": args.caCertPem,
        "cert.pem": args.certPem,
        "key.pem": args.privateKeyPem,
      },
    }, { parent: this });

    const pvc = args.pvConfig ? new k8s.core.v1.PersistentVolumeClaim(`${name}-buildkitd-pvc`, {
        metadata: {
            name: `${name}-buildkitd-pvc`,
            namespace: namespace,
        },
        spec: {
            accessModes: ["ReadWriteOnce"],
            storageClassName: pulumi.output(args.pvConfig).storageClass,
            resources: {
                requests: {
                    storage: pulumi.output(args.pvConfig).size,
                },
            },
        },
    }, {
        parent: this,
        }) : undefined;

    const bottlerocketDaemon = args.bottlerocket ? 
        new k8s.apps.v1.DaemonSet(`${name}-sysctl-userns`, {
            metadata: {
                name: `${name}-sysctl-userns`,
                namespace: namespace,
                labels: {
                    app: `${name}-sysctl-userns`,
                },
            },
            spec: {
                selector: {
                    matchLabels: {
                        app: `${name}-sysctl-userns`,
                    },
                },
                template: {
                    metadata: {
                        labels: {
                            app: `${name}-sysctl-userns`,
                        },
                    },
                    spec: {
                        nodeSelector: args.nodeSelector,
                        containers: [{
                            name: "sysctl-userns",
                            image: "public.ecr.aws/docker/library/busybox",
                            command: ["sh", "-euxc", "sysctl -w user.max_user_namespaces=63359 && sleep infinity"],
                            securityContext: {
                                privileged: true,
                            },
                        }],
                        tolerations: args.tolerations,
                    },
                },
            },
        }, { parent: this }) : undefined;

    // Create a StatefulSet for buildkit (converted from Deployment)
    const statefulSet = new k8s.apps.v1.StatefulSet(`${name}-buildkitd`, {
      metadata: {
        name: `${name}-buildkitd`,
        namespace: namespace,
        labels: {
          app: `${name}-buildkitd`,
        },
      },
      spec: {
        replicas: args.replicas ?? 1,
        selector: {
          matchLabels: {
            app: `${name}-buildkitd`,
          },
        },
        serviceName: `${name}-buildkitd`, // Required for StatefulSet
        template: {
          metadata: {
            labels: {
              app: `${name}-buildkitd`,
            },
          },
          spec: {
            nodeSelector: args.nodeSelector,
            tolerations: args.tolerations,
            resources: args.resources,
            containers: [{
              name: "buildkitd",
              image: "moby/buildkit:master-rootless",
              args: [
                "--addr",
                "unix:///run/user/1000/buildkit/buildkitd.sock",
                "--addr",
                "tcp://0.0.0.0:1234",
                "--tlscacert",
                "/certs/ca.pem",
                "--tlscert",
                "/certs/cert.pem",
                "--tlskey",
                "/certs/key.pem",
                "--oci-worker-no-process-sandbox",
              ],
              readinessProbe: {
                exec: {
                  command: [
                    "buildctl",
                    "debug",
                    "workers",
                  ],
                },
                initialDelaySeconds: 5,
                periodSeconds: 30,
              },
              livenessProbe: {
                exec: {
                  command: [
                    "buildctl",
                    "debug",
                    "workers",
                  ],
                },
                initialDelaySeconds: 5,
                periodSeconds: 30,
              },
              securityContext: {
                seccompProfile: {
                  type: "Unconfined",
                },
                appArmorProfile: {
                  type: "Unconfined",
                },
                runAsUser: 1000,
                runAsGroup: 1000,
              },
              ports: [{
                containerPort: 1234,
              }],
              volumeMounts: [
                {
                  name: "certs",
                  readOnly: true,
                  mountPath: "/certs",
                },
                {
                  name: "buildkitd",
                  mountPath: "/home/user/.local/share/buildkit",
                },
              ],
            }],
            volumes: [
              {
                name: "certs",
                secret: {
                  secretName: certSecret.metadata.name,
                },
              },
              {
                name: "buildkitd",
                emptyDir: args.pvConfig !== undefined ? undefined : {},
                persistentVolumeClaim: pvc !== undefined ? {
                  claimName: pvc.metadata.name,
                } : undefined,
              },
            ],
          },
        },
      },
    }, { parent: this, dependsOn: bottlerocketDaemon });

    // Create a Service for buildkit
    const service = new k8s.core.v1.Service(`${name}-service`, {
      metadata: {
        name: `${name}-service`,
        namespace: namespace,
        labels: {
          app: `${name}-buildkitd`,
        },
      },
      spec: {
        ports: [{
          port: 1234,
          protocol: "TCP",
        }],
        selector: {
          app: `${name}-buildkitd`,
        },
      },
    }, { parent: this });

    // Register outputs
    this.registerOutputs({
      statefulSet,
      service,
      certSecret,
    });
    }
}
