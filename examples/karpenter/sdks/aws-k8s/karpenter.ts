// *** WARNING: this file was generated by pulumi-language-nodejs. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
import * as utilities from "./utilities";

export class Karpenter extends pulumi.ComponentResource {
    /** @internal */
    public static readonly __pulumiType = 'aws-k8s:index:Karpenter';

    /**
     * Returns true if the given object is an instance of Karpenter.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is Karpenter {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === Karpenter.__pulumiType;
    }

    public /*out*/ readonly controllerRoleName!: pulumi.Output<string>;
    public /*out*/ readonly nodeRoleName!: pulumi.Output<string>;
    public /*out*/ readonly queueArn!: pulumi.Output<string>;

    /**
     * Create a Karpenter resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: KarpenterArgs, opts?: pulumi.ComponentResourceOptions) {
        let resourceInputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            if ((!args || args.clusterName === undefined) && !opts.urn) {
                throw new Error("Missing required property 'clusterName'");
            }
            if ((!args || args.version === undefined) && !opts.urn) {
                throw new Error("Missing required property 'version'");
            }
            resourceInputs["clusterName"] = args ? args.clusterName : undefined;
            resourceInputs["controllerRoleArgs"] = args ? args.controllerRoleArgs : undefined;
            resourceInputs["controllerRoleArn"] = args ? args.controllerRoleArn : undefined;
            resourceInputs["createAccessEntry"] = args ? args.createAccessEntry : undefined;
            resourceInputs["helmValues"] = args ? args.helmValues : undefined;
            resourceInputs["kubeconfig"] = args ? args.kubeconfig : undefined;
            resourceInputs["nodeRoleArgs"] = args ? args.nodeRoleArgs : undefined;
            resourceInputs["nodeRoleArn"] = args ? args.nodeRoleArn : undefined;
            resourceInputs["queue"] = args ? args.queue : undefined;
            resourceInputs["serviceAccount"] = args ? args.serviceAccount : undefined;
            resourceInputs["tags"] = args ? args.tags : undefined;
            resourceInputs["version"] = args ? args.version : undefined;
            resourceInputs["controllerRoleName"] = undefined /*out*/;
            resourceInputs["nodeRoleName"] = undefined /*out*/;
            resourceInputs["queueArn"] = undefined /*out*/;
        } else {
            resourceInputs["controllerRoleName"] = undefined /*out*/;
            resourceInputs["nodeRoleName"] = undefined /*out*/;
            resourceInputs["queueArn"] = undefined /*out*/;
        }
        opts = pulumi.mergeOptions(utilities.resourceOptsDefaults(), opts);
        super(Karpenter.__pulumiType, name, resourceInputs, opts, true /*remote*/);
    }
}

/**
 * The set of arguments for constructing a Karpenter resource.
 */
export interface KarpenterArgs {
    /**
     * The name of the EKS cluster where Karpenter will be deployed.
     */
    clusterName: pulumi.Input<string>;
    /**
     * Configuration for creating the Karpenter controller IAM role.
     * Only used if controllerRoleArn is not provided.
     */
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
    helmValues?: pulumi.Input<{[key: string]: any}>;
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
    /**
     * Configuration for the SQS queue used by Karpenter for node interruption handling.
     */
    queue?: inputs.QueueArgsArgs;
    /**
     * The name of the Kubernetes service account to use for Karpenter.
     * If not provided, a default name ('karpenter') will be used.
     */
    serviceAccount?: pulumi.Input<string>;
    /**
     * Tags to apply to all resources created by this component.
     */
    tags?: pulumi.Input<{[key: string]: pulumi.Input<string>}>;
    /**
     * The version of Karpenter to deploy.
     */
    version: pulumi.Input<string>;
}
