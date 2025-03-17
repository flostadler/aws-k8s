import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as pulumiAws from "@pulumi/aws";
export declare class Cluster extends pulumi.ComponentResource {
    /**
     * Returns true if the given object is an instance of Cluster.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Cluster;
    readonly cluster: pulumi.Output<pulumiAws.eks.Cluster>;
    readonly clusterAdmins: pulumi.Output<string[]>;
    readonly clusterRoleArn: pulumi.Output<string>;
    readonly clusterSecurityGroupId: pulumi.Output<string>;
    readonly encryptionKeyArn: pulumi.Output<string>;
    readonly installedAddons: pulumi.Output<string[]>;
    /**
     * Create a Cluster resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: ClusterArgs, opts?: pulumi.ComponentResourceOptions);
}
/**
 * The set of arguments for constructing a Cluster resource.
 */
export interface ClusterArgs {
    /**
     * Map of EKS add-ons to install in the cluster.
     * The key is the add-on name and the value is its configuration.
     */
    addons?: pulumi.Input<{
        [key: string]: pulumi.Input<inputs.AddonConfigurationArgs>;
    }>;
    /**
     * Configuration for EKS auto mode, which enables automatic node pool management.
     */
    autoMode?: inputs.AutoModeConfigArgs;
    /**
     * The ARN of a KMS key to use for encrypting Kubernetes secrets.
     * If not provided, a key will be created automatically.
     */
    encryptionKeyArn?: pulumi.Input<string>;
    /**
     * The name of the EKS cluster.
     * If not provided, a name will be generated.
     */
    name?: pulumi.Input<string>;
    /**
     * Configuration for the cluster's networking, including IP family and CIDR ranges.
     */
    networkConfig?: inputs.NetworkConfigArgs;
    /**
     * The ARN of an existing IAM role to use for the EKS cluster.
     * If not provided, a role will be created automatically.
     */
    roleArn?: pulumi.Input<string>;
    /**
     * The support type for the EKS cluster.
     * Can be either STANDARD or EXTENDED.
     */
    supportType?: pulumi.Input<string>;
    /**
     * Tags to apply to all resources created for the cluster.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    /**
     * The Kubernetes version to use for the cluster.
     * If not specified, the latest version will be used.
     */
    version?: pulumi.Input<string>;
    /**
     * Configuration for the VPC where the EKS cluster will be created.
     */
    vpcConfig: inputs.VpcConfigArgs;
    /**
     * Configuration for EKS Zonal Shift.
     * Zonal Shift helps maintain availability if there are problems in an Availability Zone.
     */
    zonalShiftConfig?: inputs.ZonalShiftConfigArgs;
}
