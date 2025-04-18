import * as pulumi from "@pulumi/pulumi";
import * as inputs from "../types/input";
export interface AddonConfigurationArgs {
    /**
     * The version of the EKS add-on. The version must
     * match one of the versions returned by [describe-addon-versions](https://docs.aws.amazon.com/cli/latest/reference/eks/describe-addon-versions.html).
     */
    addonVersion?: pulumi.Input<string>;
    /**
     * custom configuration values for addons. It must match the JSON schema derived from [describe-addon-configuration](https://docs.aws.amazon.com/cli/latest/reference/eks/describe-addon-configuration.html).
     */
    configurationValues?: pulumi.Input<{
        [key: string]: any;
    }>;
    /**
     * Whether to use the most recent version of the addon.
     * If true, the addon will be automatically updated to the latest version.
     * Otherwise, the default version for the cluster will be used.
     */
    mostRecent?: pulumi.Input<boolean>;
    /**
     * Configuration block with EKS Pod Identity association settings. See `podIdentityAssociation` below for details.
     */
    podIdentityAssociations?: pulumi.Input<pulumi.Input<inputs.AddonPodIdentityAssociationArgs>[]>;
    /**
     * Indicates if you want to preserve the created resources when deleting the EKS add-on.
     */
    preserve?: pulumi.Input<boolean>;
    /**
     * Define how to resolve parameter value conflicts when migrating an existing add-on to an Amazon EKS add-on or when applying version updates to the add-on. Valid values are `NONE`, `OVERWRITE` and `PRESERVE`. Note that `PRESERVE` is only valid on addon update, not for initial addon creation. If you need to set this to `PRESERVE`, use the `resolveConflictsOnCreate` and `resolveConflictsOnUpdate` attributes instead. For more details check [UpdateAddon](https://docs.aws.amazon.com/eks/latest/APIReference/API_UpdateAddon.html) API Docs.
     */
    resolveConflicts?: pulumi.Input<string>;
    /**
     * How to resolve field value conflicts when migrating a self-managed add-on to an Amazon EKS add-on. Valid values are `NONE` and `OVERWRITE`. For more details see the [CreateAddon](https://docs.aws.amazon.com/eks/latest/APIReference/API_CreateAddon.html) API Docs.
     */
    resolveConflictsOnCreate?: pulumi.Input<string>;
    /**
     * How to resolve field value conflicts for an Amazon EKS add-on if you've changed a value from the Amazon EKS default value. Valid values are `NONE`, `OVERWRITE`, and `PRESERVE`. For more details see the [UpdateAddon](https://docs.aws.amazon.com/eks/latest/APIReference/API_UpdateAddon.html) API Docs.
     */
    resolveConflictsOnUpdate?: pulumi.Input<string>;
    /**
     * The Amazon Resource Name (ARN) of an
     * existing IAM role to bind to the add-on's service account. The role must be
     * assigned the IAM permissions required by the add-on. If you don't specify
     * an existing IAM role, then the add-on uses the permissions assigned to the node
     * IAM role. For more information, see [Amazon EKS node IAM role](https://docs.aws.amazon.com/eks/latest/userguide/create-node-role.html)
     * in the Amazon EKS User Guide.
     *
     * > **Note:** To specify an existing IAM role, you must have an IAM OpenID Connect (OIDC)
     * provider created for your cluster. For more information, [see Enabling IAM roles
     * for service accounts on your cluster](https://docs.aws.amazon.com/eks/latest/userguide/enable-iam-roles-for-service-accounts.html)
     * in the Amazon EKS User Guide.
     */
    serviceAccountRoleArn?: pulumi.Input<string>;
    /**
     * Key-value map of resource tags. If configured with a provider `defaultTags` configuration block present, tags with matching keys will overwrite those defined at the provider-level.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
}
export interface AddonPodIdentityAssociationArgs {
    /**
     * The Amazon Resource Name (ARN) of the IAM role to associate with the service account. The EKS Pod Identity agent manages credentials to assume this role for applications in the containers in the pods that use this service account.
     */
    roleArn: pulumi.Input<string>;
    /**
     * The name of the Kubernetes service account inside the cluster to associate the IAM credentials with.
     */
    serviceAccount: pulumi.Input<string>;
}
export interface AutoModeConfigArgs {
    /**
     * Whether auto mode is enabled for this cluster.
     */
    enabled?: pulumi.Input<boolean>;
    /**
     * List of EKS managed node pools to use.
     * If not specified, the default node pools ('general-purpose' and 'system') will be created.
     */
    nodePools?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * The ARN of the IAM role that auto mode will use for node pools.
     * If not specified, a role will be created automatically.
     */
    nodeRoleArn?: pulumi.Input<string>;
}
export interface NamespacedServiceAccountArgs {
    /**
     * The Kubernetes namespace where the service account exists.
     */
    namespace: pulumi.Input<string>;
    /**
     * The name of the Kubernetes service account.
     */
    serviceAccount: pulumi.Input<string>;
}
export interface NetworkConfigArgs {
    /**
     * IP family to use for the cluster networking.
     * Determines whether the cluster will use IPv4 or IPv6 networking.
     */
    ipFamily: pulumi.Input<string>;
    /**
     * CIDR block for Kubernetes services.
     * Must not overlap with VPC CIDR. For IPv4, use format "10.100.0.0/16".
     * For IPv6, use format "fd00:ec2::/108".
     */
    serviceCidr: pulumi.Input<string>;
}
export interface PvConfigArgs {
    size: string;
    storageClass: string;
}
export interface QueueArgsArgs {
    /**
     * The length of time, in seconds, for which Amazon SQS can reuse a data key to encrypt or decrypt messages.
     * Only used when a custom KMS key is specified. Valid values: 60 seconds to 86,400 seconds (24 hours).
     */
    kmsDataKeyReusePeriodSeconds?: pulumi.Input<number>;
    /**
     * The ID of an AWS-managed customer master key (CMK) for Amazon SQS or a custom CMK.
     * Used for server-side encryption if you want to use your own KMS key instead of SQS-owned encryption keys.
     */
    kmsMasterKeyId?: pulumi.Input<string>;
    /**
     * Whether to enable server-side encryption (SSE) for the queue using SQS-owned encryption keys.
     * When enabled, messages are automatically encrypted at rest.
     */
    managedSseEnabled?: pulumi.Input<boolean>;
    /**
     * The name of the SQS queue. If not provided, a name will be generated.
     */
    name?: pulumi.Input<string>;
    /**
     * Key-value mapping of tags for the SQS queue.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
}
export interface ResourceClaimArgs {
    /**
     * Name must match the name of one entry in pod.spec.resourceClaims of the Pod where this field is used. It makes that resource available inside a container.
     */
    name: pulumi.Input<string>;
    /**
     * Request is the name chosen for a request in the referenced claim. If empty, everything from the claim is made available, otherwise only the result of this request.
     */
    request?: pulumi.Input<string>;
}
export interface ResourceRequirementsArgs {
    /**
     * Claims lists the names of resources, defined in spec.resourceClaims, that are used by this container.
     *
     * This is an alpha field and requires enabling the DynamicResourceAllocation feature gate.
     *
     * This field is immutable. It can only be set for containers.
     */
    claims?: pulumi.Input<pulumi.Input<inputs.ResourceClaimArgs>[]>;
    /**
     * Limits describes the maximum amount of compute resources allowed. More info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
     */
    limits?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    /**
     * Requests describes the minimum amount of compute resources required. If Requests is omitted for a container, it defaults to Limits if that is explicitly specified, otherwise to an implementation-defined value. Requests cannot exceed Limits. More info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
     */
    requests?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
}
export interface RoleArgsArgs {
    /**
     * Additional managed policy ARNs to attach to the role.
     */
    additionalManagedPolicyArns?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * The description of the role.
     */
    description?: pulumi.Input<string>;
    /**
     * The maximum session duration (in seconds) that you want to set for the role.
     * This setting can have a value from 1 hour (3600) to 12 hours (43200).
     */
    maxSessionDuration?: pulumi.Input<number>;
    /**
     * The name of the role. If not provided, a name will be generated.
     */
    name?: pulumi.Input<string>;
    /**
     * The path to the role. Defaults to "/".
     */
    path?: pulumi.Input<string>;
    /**
     * The ARN of the policy that is used to set the permissions boundary for the role.
     */
    permissionsBoundary?: pulumi.Input<string>;
    /**
     * Key-value mapping of tags for the role.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
}
export interface RoleInlinePolicyArgs {
    /**
     * Name of the role policy.
     */
    name?: pulumi.Input<string>;
    /**
     * Policy document as a JSON formatted string.
     */
    policy?: pulumi.Input<string>;
}
export interface SelfSignedCertSubjectArgs {
    /**
     * Distinguished name: `CN`
     */
    commonName?: pulumi.Input<string>;
    /**
     * Distinguished name: `C`
     */
    country?: pulumi.Input<string>;
    /**
     * Distinguished name: `L`
     */
    locality?: pulumi.Input<string>;
    /**
     * Distinguished name: `O`
     */
    organization?: pulumi.Input<string>;
    /**
     * Distinguished name: `OU`
     */
    organizationalUnit?: pulumi.Input<string>;
    /**
     * Distinguished name: `PC`
     */
    postalCode?: pulumi.Input<string>;
    /**
     * Distinguished name: `ST`
     */
    province?: pulumi.Input<string>;
    /**
     * Distinguished name: `SERIALNUMBER`
     */
    serialNumber?: pulumi.Input<string>;
    /**
     * Distinguished name: `STREET`
     */
    streetAddresses?: pulumi.Input<pulumi.Input<string>[]>;
}
export interface TolerationArgs {
    /**
     * Effect indicates the taint effect to match. Empty means match all taint effects. When specified, allowed values are NoSchedule, PreferNoSchedule and NoExecute.
     */
    effect?: pulumi.Input<string>;
    /**
     * Key is the taint key that the toleration applies to. Empty means match all taint keys. If the key is empty, operator must be Exists; this combination means to match all values and all keys.
     */
    key?: pulumi.Input<string>;
    /**
     * Operator represents a key's relationship to the value. Valid operators are Exists and Equal. Defaults to Equal. Exists is equivalent to wildcard for value, so that a pod can tolerate all taints of a particular category.
     */
    operator?: pulumi.Input<string>;
    /**
     * TolerationSeconds represents the period of time the toleration (which must be of effect NoExecute, otherwise this field is ignored) tolerates the taint. By default, it is not set, which means tolerate the taint forever (do not evict). Zero and negative values will be treated as 0 (evict immediately) by the system.
     */
    tolerationSeconds?: pulumi.Input<number>;
    /**
     * Value is the taint value the toleration matches to. If the operator is Exists, the value should be empty, otherwise just a regular string.
     */
    value?: pulumi.Input<string>;
}
export interface VpcConfigArgs {
    /**
     * Types of endpoints to enable for the EKS API server.
     * Can be "private" and/or "public". Defaults to ["public"] if not specified.
     */
    apiServerEndpoints?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * Additional security group IDs to attach to the EKS cluster.
     * The cluster will automatically get a security group that allows communication between nodes.
     */
    clusterSecurityGroupIds?: pulumi.Input<string[]>;
    /**
     * List of subnet IDs where the EKS cluster and nodes will be deployed.
     * Must include both public and private subnets if public access is enabled.
     */
    subnetIds: pulumi.Input<string[]>;
}
export interface ZonalShiftConfigArgs {
    /**
     * Whether to enable zonal shift for the cluster.
     */
    enabled: pulumi.Input<boolean>;
}
