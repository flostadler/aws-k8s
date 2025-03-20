import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { getRegion } from "./util";

export interface KubeConfigArgs {
    // The name of the EKS cluster to get the kubeconfig for
    clusterName: string;
}

export class KubeConfig extends pulumi.ComponentResource {
    public readonly kubeconfig: pulumi.Output<string>;

    constructor(name: string, args: KubeConfigArgs, opts?: pulumi.ComponentResourceOptions) {
        super("aws-k8s:index:KubeConfig", name, args, opts);
        const kubeconfig = getKubeConfig(args.clusterName, { ...opts, parent: this });
        this.kubeconfig = pulumi.output(kubeconfig);
        this.registerOutputs({
            kubeconfig: kubeconfig,
        });
    }
}

export function getKubeConfig(
    clusterName: pulumi.Input<string>,
    opts?: pulumi.InvokeOptions,
  ): pulumi.Output<string> {
    const cluster = aws.eks.getClusterOutput(
      {
        name: clusterName,
      },
      opts,
    );
  
    return pulumi.output(
      cluster.certificateAuthorities.apply((certificateAuthorities) => {
        return pulumi.jsonStringify({
          apiVersion: 'v1',
          kind: 'Config',
          clusters: [
            {
              name: cluster.arn,
              cluster: {
                server: cluster.endpoint,
                'certificate-authority-data': certificateAuthorities[0].data,
              },
            },
          ],
          contexts: [
            {
              name: cluster.arn,
              context: {
                user: cluster.arn,
                cluster: cluster.arn,
              },
            },
          ],
          'current-context': cluster.arn,
          users: [
            {
              name: cluster.arn,
              user: {
                exec: {
                  apiVersion: 'client.authentication.k8s.io/v1beta1',
                  args: [
                    '--region',
                    getRegion(undefined, opts),
                    'eks',
                    'get-token',
                    '--cluster-name',
                    clusterName,
                    '--output',
                    'json',
                  ],
                  command: 'aws',
                },
              },
            },
          ],
        });
      }),
    );
  }
