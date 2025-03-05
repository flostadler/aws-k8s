import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
export declare class Karpenter extends pulumi.ComponentResource {
    /**
     * Returns true if the given object is an instance of Karpenter.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Karpenter;
    readonly controllerRoleName: pulumi.Output<string>;
    readonly nodeRoleName: pulumi.Output<string>;
    readonly queueArn: pulumi.Output<string>;
    /**
     * Create a Karpenter resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: KarpenterArgs, opts?: pulumi.ComponentResourceOptions);
}
/**
 * The set of arguments for constructing a Karpenter resource.
 */
export interface KarpenterArgs {
    /**
     * The name of the EKS cluster where Karpenter will be deployed.
     */
    clusterName: pulumi.Input<string>;
    controllerRoleArgs?: inputs.RoleArgsArgs;
    /**
     * The ARN of an existing IAM role to use for the Karpenter controller.
     * If not provided, a role will be created using controllerRoleArgs.
     */
    controllerRoleArn?: pulumi.Input<string>;
    /**
     * Whether to create an EKS access entry for the Karpenter IAM roles.
     */
    createAccessEntry?: pulumi.Input<boolean>;
    /**
     * Additional values to pass to the Karpenter Helm chart.
     */
    helmValues?: pulumi.Input<{
        [key: string]: any;
    }>;
    /**
     * The kubeconfig to use for deploying Karpenter.
     * If not provided, will be generated from the cluster.
     */
    kubeconfig?: pulumi.Input<string>;
    nodeRoleArgs?: inputs.RoleArgsArgs;
    /**
     * The ARN of an existing IAM role to use for Karpenter-managed nodes.
     * If not provided, a role will be created using nodeRoleArgs.
     */
    nodeRoleArn?: pulumi.Input<string>;
    queue?: inputs.QueueArgsArgs;
    /**
     * The name of the Kubernetes service account to use for Karpenter.
     * If not provided, a default name ('karpenter') will be used.
     */
    serviceAccount?: pulumi.Input<string>;
    /**
     * Tags to apply to all resources created by this component.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    /**
     * The version of Karpenter to deploy.
     */
    version: pulumi.Input<string>;
}
