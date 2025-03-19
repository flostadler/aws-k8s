import * as awsx from "@pulumi/awsx";
import * as k8s from "@pulumi/kubernetes";
import * as awsK8s from "@pulumi/aws-k8s";
import { getKubeConfig } from "aws-k8s/src/cluster";

const vpc = new awsx.ec2.Vpc("vpc", {
    cidrBlock: "10.0.0.0/16",
});

const eksCluster = new awsK8s.Cluster("cluster", {
    vpcConfig: {
        subnetIds: vpc.publicSubnetIds,
    },
    addons: {
        coredns: {
            configurationValues: {
                autoScaling: {
                    enabled: true,
                    minReplicas: 2,
                    maxReplicas: 10,
                },
            },
        },
        "eks-pod-identity-agent": {},
        "kube-proxy": {},
        "vpc-cni": {},
    },
    autoMode: {
        enabled: true,
        // Karpenter and coredns will run in the system node pool
        nodePools: ["system"],
    }
});

const karpenterInstance = new awsK8s.Karpenter("karpenter", {
    clusterName: eksCluster.cluster.name,
    version: "1.3.2",
    nodeRoleArgs: {
        additionalManagedPolicyArns: [
            "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
    },
    helmValues: {
        nodeSelector: {
            "karpenter.sh/nodepool": "system"
        },
        affinity: {
            nodeAffinity: {
                requiredDuringSchedulingIgnoredDuringExecution: {
                    nodeSelectorTerms: [{
                        matchExpressions: [{
                            key: "eks.amazonaws.com/compute-type",
                            operator: "In",
                            values: ["auto"],
                        }]
                    }]
                }
            }
        },
    },
}, { dependsOn: eksCluster });

const k8sProvider = new k8s.Provider("k8s", {
    kubeconfig: getKubeConfig(eksCluster.cluster.name),
});

const nodeClass = new k8s.apiextensions.CustomResource("karpenter-node-class", {
    apiVersion: "karpenter.k8s.aws/v1",
    kind: "EC2NodeClass",
    metadata: {
        name: "general-purpose"
    },
    spec: {
        amiSelectorTerms: [{
            alias: "bottlerocket@latest"
        }],
        role: karpenterInstance.nodeRoleName,
        subnetSelectorTerms: vpc.privateSubnetIds.apply(ids => ids.map(id => ({
            id,
        }))),
        securityGroupSelectorTerms: [{
            id: eksCluster.clusterSecurityGroupId,
        }],
    }
}, { dependsOn: karpenterInstance, provider: k8sProvider });

const nodePool = new k8s.apiextensions.CustomResource("karpenter-node-pool", {
    apiVersion: "karpenter.sh/v1",
    kind: "NodePool",
    metadata: {
        name: "general-purpose"
    },
    spec: {
        template: {
            spec: {
                nodeClassRef: {
                    group: "karpenter.k8s.aws",
                    kind: "EC2NodeClass", 
                    name: "general-purpose"
                },
                requirements: [
                    {
                        key: "karpenter.k8s.aws/instance-category",
                        operator: "In",
                        values: ["c", "m", "r"]
                    },
                    {
                        key: "karpenter.k8s.aws/instance-cpu",
                        operator: "In", 
                        values: ["2", "4", "8", "16", "32"]
                    },
                    {
                        key: "karpenter.k8s.aws/instance-hypervisor",
                        operator: "In",
                        values: ["nitro"]
                    },
                    {
                        key: "karpenter.k8s.aws/instance-generation",
                        operator: "Gt",
                        values: ["5"]
                    }
                ]
            }
        },
        limits: {
            cpu: 40
        },
        disruption: {
            consolidationPolicy: "WhenEmpty",
            consolidateAfter: "30s"
        }
    }
}, { dependsOn: [karpenterInstance, nodeClass], provider: k8sProvider });

const deployment = new k8s.apps.v1.Deployment("inflate", {
    metadata: {
        name: "inflate"
    },
    spec: {
        replicas: 10,
        selector: {
            matchLabels: {
                app: "inflate"
            }
        },
        template: {
            metadata: {
                labels: {
                    app: "inflate"
                }
            },
            spec: {
                terminationGracePeriodSeconds: 0,
                topologySpreadConstraints: [
                    {
                        maxSkew: 1,
                        topologyKey: "topology.kubernetes.io/zone",
                        whenUnsatisfiable: "ScheduleAnyway",
                        labelSelector: {
                            matchLabels: {
                                app: "inflate"
                            }
                        }
                    }
                ],
                containers: [{
                    name: "inflate",
                    image: "public.ecr.aws/eks-distro/kubernetes/pause:3.7",
                    resources: {
                        requests: {
                            cpu: "1"
                        }
                    }
                }]
            }
        }
    }
}, { provider: k8sProvider, dependsOn: nodePool });
