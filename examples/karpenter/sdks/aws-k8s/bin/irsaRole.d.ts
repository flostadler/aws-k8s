import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
/**
 * IrsaRole creates an IAM role that can be assumed by Kubernetes service accounts (IRSA).
 * It automatically configures the trust relationship between the IAM role and the EKS cluster's OIDC provider.
 *
 * The role can be assumed by one or more Kubernetes service accounts specified in the args.
 * The trust relationship is configured to only allow the specified service accounts to assume the role.
 */
export declare class IrsaRole extends pulumi.ComponentResource {
    /**
     * Returns true if the given object is an instance of IrsaRole.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is IrsaRole;
    readonly roleName: pulumi.Output<string>;
    /**
     * Create a IrsaRole resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: IrsaRoleArgs, opts?: pulumi.ComponentResourceOptions);
}
/**
 * The set of arguments for constructing a IrsaRole resource.
 */
export interface IrsaRoleArgs {
    /**
     * The name of the EKS cluster where the service accounts exist.
     * Used to configure the OIDC provider trust relationship.
     */
    clusterName: pulumi.Input<string>;
    /**
     * Description of the role.
     */
    description?: pulumi.Input<string>;
    /**
     * Whether to force detaching any policies the role has before destroying it. Defaults to `false`.
     */
    forceDetachPolicies?: pulumi.Input<boolean>;
    /**
     * Configuration block defining an exclusive set of IAM inline policies associated with the IAM role. See below. If no blocks are configured, Pulumi will not manage any inline policies in this resource. Configuring one empty block (i.e., `inlinePolicy {}`) will cause Pulumi to remove _all_ inline policies added out of band on `apply`.
     */
    inlinePolicies?: pulumi.Input<pulumi.Input<inputs.RoleInlinePolicyArgs>[]>;
    /**
     * Set of exclusive IAM managed policy ARNs to attach to the IAM role. If this attribute is not configured, Pulumi will ignore policy attachments to this resource. When configured, Pulumi will align the role's managed policy attachments with this set by attaching or detaching managed policies. Configuring an empty set (i.e., `managedPolicyArns = []`) will cause Pulumi to remove _all_ managed policy attachments.
     */
    managedPolicyArns?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * Maximum session duration (in seconds) that you want to set for the specified role. If you do not specify a value for this setting, the default maximum of one hour is applied. This setting can have a value from 1 hour to 12 hours.
     */
    maxSessionDuration?: pulumi.Input<number>;
    /**
     * Friendly name of the role. If omitted, the provider will assign a random, unique name. See [IAM Identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html) for more information.
     */
    name?: pulumi.Input<string>;
    /**
     * Creates a unique friendly name beginning with the specified prefix. Conflicts with `name`.
     */
    namePrefix?: pulumi.Input<string>;
    /**
     * Path to the role. See [IAM Identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html) for more information.
     */
    path?: pulumi.Input<string>;
    /**
     * ARN of the policy that is used to set the permissions boundary for the role.
     */
    permissionsBoundary?: pulumi.Input<string>;
    /**
     * List of Kubernetes service accounts that can assume this role.
     * Each service account is identified by its namespace and name.
     */
    serviceAccounts?: pulumi.Input<pulumi.Input<inputs.NamespacedServiceAccountArgs>[]>;
    /**
     * Key-value mapping of tags for the IAM role. If configured with a provider `defaultTags` configuration block present, tags with matching keys will overwrite those defined at the provider-level.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
}
