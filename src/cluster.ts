import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsNative from '@pulumi/aws-native';
import { getPartition, getRegion, Tags } from './util';

export type ClusterEndpointType = 'public' | 'private';
export type SupportType = 'STANDARD' | 'EXTENDED';

/**
 * Configuration options for creating an EKS cluster.
 */
export interface ClusterArgs {
  /**
   * The name of the EKS cluster.
   * If not provided, a name will be generated.
   */
  name?: pulumi.Input<string>;

  /**
   * The ARN of an existing IAM role to use for the EKS cluster.
   * If not provided, a role will be created automatically.
   */
  roleArn?: pulumi.Input<string>;

  /**
   * Configuration for the VPC where the EKS cluster will be created.
   */
  vpcConfig: VpcConfig;

  /**
   * The Kubernetes version to use for the cluster.
   * If not specified, the latest version will be used.
   */
  version?: pulumi.Input<string>;

  /**
   * Configuration for EKS Zonal Shift.
   * Zonal Shift helps maintain availability if there are problems in an Availability Zone.
   */
  zonalShiftConfig?: ZonalShiftConfig;

  /**
   * The support type for the EKS cluster.
   * Can be either STANDARD or EXTENDED.
   */
  supportType?: pulumi.Input<string>;

  /**
   * Configuration for the cluster's networking, including IP family and CIDR ranges.
   */
  networkConfig?: NetworkConfig;

  /**
   * The ARN of a KMS key to use for encrypting Kubernetes secrets.
   * If not provided, a key will be created automatically.
   */
  encryptionKeyArn?: pulumi.Input<string>;

  /**
   * Map of EKS add-ons to install in the cluster.
   * The key is the add-on name and the value is its configuration.
   */
  addons?: pulumi.Input<{ [key: string]: pulumi.Input<AddonConfiguration> }>;

  /**
   * Configuration for EKS auto mode, which enables automatic node pool management.
   */
  autoMode?: AutoModeConfig;

  /**
   * Tags to apply to all resources created for the cluster.
   */
  tags?: Tags;
}

/**
 * Configuration for EKS cluster auto mode.
 * Auto mode allows the cluster to automatically manage node pools and scaling.
 */
export interface AutoModeConfig {
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

/**
 * Configuration for an EKS cluster addon.
 */
export interface AddonConfiguration {
  /**
   * The version of the EKS add-on. The version must
   * match one of the versions returned by [describe-addon-versions](https://docs.aws.amazon.com/cli/latest/reference/eks/describe-addon-versions.html).
   */
  addonVersion?: pulumi.Input<string>;
  /**
   * Configuration block with EKS Pod Identity association settings. See `podIdentityAssociation` below for details.
   */
  podIdentityAssociations?: pulumi.Input<
    pulumi.Input<aws.types.input.eks.AddonPodIdentityAssociation>[]
  >;
  /**
   * Indicates if you want to preserve the created resources when deleting the EKS add-on.
   */
  preserve?: pulumi.Input<boolean>;
  /**
   * Define how to resolve parameter value conflicts when migrating an existing add-on to an Amazon EKS add-on or when applying version updates to the add-on. Valid values are `NONE`, `OVERWRITE` and `PRESERVE`. Note that `PRESERVE` is only valid on addon update, not for initial addon creation. If you need to set this to `PRESERVE`, use the `resolveConflictsOnCreate` and `resolveConflictsOnUpdate` attributes instead. For more details check [UpdateAddon](https://docs.aws.amazon.com/eks/latest/APIReference/API_UpdateAddon.html) API Docs.
   *
   * @deprecated The "resolveConflicts" attribute can't be set to "PRESERVE" on initial resource creation. Use "resolveConflictsOnCreate" and/or "resolveConflictsOnUpdate" instead
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
  /**
   * custom configuration values for addons. It must match the JSON schema derived from [describe-addon-configuration](https://docs.aws.amazon.com/cli/latest/reference/eks/describe-addon-configuration.html).
   */
  configurationValues?: pulumi.Input<{[key: string]: any}>;
  /**
   * Whether to use the most recent version of the addon.
   * If true, the addon will be automatically updated to the latest version.
   * Otherwise, the default version for the cluster will be used.
   */
  mostRecent?: pulumi.Input<boolean>;
}

/**
 * Configuration for the VPC where the EKS cluster will be created.
 */
export interface VpcConfig {
  /**
   * List of subnet IDs where the EKS cluster and nodes will be deployed.
   * Must include both public and private subnets if public access is enabled.
   */
  subnetIds: pulumi.Input<string[]>;

  /**
   * Additional security group IDs to attach to the EKS cluster.
   * The cluster will automatically get a security group that allows communication between nodes.
   */
  clusterSecurityGroupIds?: pulumi.Input<string[]>;

  /**
   * Types of endpoints to enable for the EKS API server.
   * Can be "private" and/or "public". Defaults to ["public"] if not specified.
   */
  apiServerEndpoints?: pulumi.Input<pulumi.Input<string>[]>;
}

/**
 * Configuration for EKS cluster zonal shift.
 * Zonal shift allows EKS to automatically shift workloads to other availability zones in case of zone failures.
 */
export interface ZonalShiftConfig {
  /**
   * Whether to enable zonal shift for the cluster.
   */
  enabled: pulumi.Input<boolean>;
}

/**
 * Configuration for the EKS cluster networking.
 */
export interface NetworkConfig {
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

export class Cluster extends pulumi.ComponentResource {
  public readonly eksCluster: aws.eks.Cluster;
  public readonly clusterSecurityGroupId: pulumi.Output<string>;
  public readonly encryptionKeyArn: pulumi.Output<string>;
  public readonly clusterRoleArn: pulumi.Output<string>;
  public readonly installedAddons: pulumi.Output<string[]>;
  public readonly clusterAdmins: pulumi.Output<string[]>;

  constructor(
    name: string,
    args: ClusterArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('aws-k8s:index:Cluster', name, args, opts);

    const partition = getPartition(this);

    const encryptionKeyArn = this.getClusterEncryptionKey(name, args);
    const clusterRoleArn = this.getClusterRoleArn(
      name,
      args,
      partition,
      encryptionKeyArn,
    );

    const autoModeRoleArn = this.getAutoModeRoleArn(name, args, partition);

    this.eksCluster = new aws.eks.Cluster(
      name,
      {
        name: args.name,
        roleArn: clusterRoleArn,
        version: args.version,
        vpcConfig: {
          subnetIds: args.vpcConfig.subnetIds,
          endpointPrivateAccess: pulumi
            .output(args.vpcConfig.apiServerEndpoints)
            .apply((endpoints) => endpoints?.includes('private') ?? false),
          endpointPublicAccess: pulumi
            .output(args.vpcConfig.apiServerEndpoints)
            .apply((endpoints) => endpoints?.includes('public') ?? true),
          securityGroupIds: args.vpcConfig.clusterSecurityGroupIds,
        },
        zonalShiftConfig: {
          enabled: args.zonalShiftConfig?.enabled ?? false,
        },
        upgradePolicy: args.supportType
          ? {
              supportType: args.supportType,
            }
          : undefined,

        kubernetesNetworkConfig: {
          elasticLoadBalancing: {
            enabled: pulumi
              .output(args.autoMode?.enabled)
              .apply((enabled) => enabled ?? true),
          },
          ipFamily: args.networkConfig?.ipFamily,

          // those casts actually work, I promise (fingers crossed)
          serviceIpv4Cidr: args.networkConfig?.serviceCidr
            ? (pulumi
                .all([
                  args.networkConfig.serviceCidr,
                  args.networkConfig?.ipFamily,
                ])
                .apply(([serviceCidr, ipFamily]) =>
                  ipFamily === 'ipv4' ? serviceCidr : undefined,
                ) as pulumi.Output<string>)
            : undefined,
          serviceIpv6Cidr: args.networkConfig?.serviceCidr
            ? (pulumi
                .all([
                  args.networkConfig.serviceCidr,
                  args.networkConfig?.ipFamily,
                ])
                .apply(([serviceCidr, ipFamily]) =>
                  ipFamily === 'ipv6' ? serviceCidr : undefined,
                ) as pulumi.Output<string>)
            : undefined,
        },

        storageConfig: {
          blockStorage: {
            enabled: pulumi
              .output(args.autoMode?.enabled)
              .apply((enabled) => enabled ?? true),
          },
        },

        // no self-managed addons. we'll install the necessary ones ourselves
        bootstrapSelfManagedAddons: false,

        accessConfig: {
          authenticationMode: 'API',
          bootstrapClusterCreatorAdminPermissions: false,
        },

        // encryption is always enabled
        encryptionConfig: {
          provider: {
            keyArn: encryptionKeyArn,
          },
          resources: ['secrets'],
        },

        computeConfig: {
          enabled: pulumi
            .output(args.autoMode?.enabled)
            .apply((enabled) => enabled ?? true),
          nodePools: pulumi
            .output(args.autoMode?.nodePools)
            .apply((nodePools) => nodePools ?? ['general-purpose', 'system']),
          nodeRoleArn: autoModeRoleArn,
        },

        tags: args.tags,
      },
      {
        parent: this,
      },
    );

    this.clusterSecurityGroupId = this.eksCluster.vpcConfig.clusterSecurityGroupId;

    const clusterCreator = aws.iam.getSessionContextOutput(
      {
        arn: aws.getCallerIdentityOutput({}, { parent: this }).arn,
      },
      { parent: this },
    ).issuerArn;

    const clusterCreatorAdmin = this.createClusterAdmins(
      `${name}-cluster-creator-admin`,
      this.eksCluster,
      clusterCreator,
      partition,
      args.tags,
    );
    this.clusterAdmins = pulumi.output([clusterCreatorAdmin]);

    this.encryptionKeyArn = pulumi.output(encryptionKeyArn);
    this.clusterRoleArn = pulumi.output(clusterRoleArn);

    const addons = pulumi.output(args.addons).apply((addons) => {
      return Object.entries(addons ?? {}).map(([addonName, args]) => {
        const version = pulumi.output(args.addonVersion).apply((version) => {
          if (version) {
            return pulumi.output(version);
          }
          return aws.eks.getAddonVersionOutput(
            {
              addonName: addonName,
              kubernetesVersion: this.eksCluster.version,
              mostRecent: args.mostRecent,
            },
            { parent: this },
          ).version;
        });
        const { addonVersion: _, configurationValues: __, ...addonArgs } = args;

        return new aws.eks.Addon(
          `${name}-${addonName}`,
          {
            ...addonArgs,
            clusterName: this.eksCluster.name,
            addonName: addonName,
            addonVersion: version,
            configurationValues: args.configurationValues
              ? pulumi.jsonStringify(args.configurationValues)
              : undefined,
            tags: args.tags,
          },
          { parent: this },
        );
      });
    });

    this.installedAddons = pulumi.output(
      addons.apply((addons) => addons.map((addon) => addon.addonName)),
    );

    this.registerOutputs({
      eksCluster: this.eksCluster,
      encryptionKeyArn: this.encryptionKeyArn,
      clusterRoleArn: this.clusterRoleArn,
      installedAddons: this.installedAddons,
    });
  }

  getAutoModeRoleArn(
    name: string,
    args: ClusterArgs,
    partition: pulumi.Output<string>,
  ): pulumi.Input<string> | undefined {
    return pulumi.output(args.autoMode?.enabled).apply((enabled) => {
      if (!enabled) {
        // trust me, this works (hopefully)
        return pulumi.output(undefined) as any;
      }

      if (args.autoMode?.nodeRoleArn) {
        return pulumi.output(args.autoMode.nodeRoleArn);
      }

      const role = new awsNative.iam.Role(
        `${name}-auto-mode-role`,
        {
          assumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'ec2.amazonaws.com',
                },
                Action: ['sts:AssumeRole', 'sts:TagSession'],
              },
            ],
          },
          managedPolicyArns: [
            pulumi.interpolate`arn:${partition}:iam::aws:policy/AmazonEKSWorkerNodeMinimalPolicy`,
            pulumi.interpolate`arn:${partition}:iam::aws:policy/AmazonEC2ContainerRegistryPullOnly`,
          ],
          tags: args.tags
            ? pulumi
                .output(args.tags)
                .apply((tags) =>
                  Object.entries(tags).map(([key, value]) => ({ key, value })),
                )
            : undefined,
        },
        { parent: this },
      );

      return role.arn;
    });
  }

  getClusterRoleArn(
    name: string,
    args: ClusterArgs,
    partition: pulumi.Output<string>,
    encryptionKeyArn: pulumi.Input<string>,
  ): pulumi.Input<string> {
    if (args.roleArn) {
      return args.roleArn;
    }

    const role = new awsNative.iam.Role(
      `${name}-cluster-role`,
      {
        assumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'eks.amazonaws.com',
              },
              Action: ['sts:AssumeRole', 'sts:TagSession'],
            },
          ],
        },

        managedPolicyArns: [
          pulumi.interpolate`arn:${partition}:iam::aws:policy/AmazonEKSClusterPolicy`,
          pulumi.interpolate`arn:${partition}:iam::aws:policy/AmazonEKSComputePolicy`,
          pulumi.interpolate`arn:${partition}:iam::aws:policy/AmazonEKSBlockStoragePolicy`,
          pulumi.interpolate`arn:${partition}:iam::aws:policy/AmazonEKSLoadBalancingPolicy`,
          pulumi.interpolate`arn:${partition}:iam::aws:policy/AmazonEKSNetworkingPolicy`,
        ],

        policies: [
          {
            policyName: 'EKSClusterEncryptionPolicy',
            policyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'kms:Encrypt',
                    'kms:Decrypt',
                    'kms:ReEncrypt*',
                    'kms:GenerateDataKey*',
                    'kms:DescribeKey',
                  ],
                  Resource: encryptionKeyArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'kms:CreateGrant',
                    'kms:ListGrants',
                    'kms:RevokeGrant',
                  ],
                  Resource: '*',
                  Condition: {
                    Bool: {
                      'kms:GrantIsForAWSResource': 'true',
                    },
                  },
                },
              ],
            },
          },
        ],

        tags: args.tags
          ? pulumi
              .output(args.tags)
              .apply((tags) =>
                Object.entries(tags).map(([key, value]) => ({ key, value })),
              )
          : undefined,
      },
      { parent: this },
    );

    return role.arn;
  }

  getClusterEncryptionKey(
    name: string,
    args: ClusterArgs,
  ): pulumi.Input<string> {
    if (args.encryptionKeyArn) {
      return args.encryptionKeyArn;
    }

    const key = new aws.kms.Key(
      name,
      {
        description: `Encryption key for EKS cluster ${args.name}`,
        enableKeyRotation: true,
        tags: args.tags,
      },
      { parent: this },
    );

    return key.arn;
  }

  createClusterAdmins(
    name: string,
    cluster: aws.eks.Cluster,
    principalArn: pulumi.Input<string>,
    partition: pulumi.Output<string>,
    tags: Tags | undefined,
  ): pulumi.Output<string> {
    const clusterCreatorAdminPermissions = new aws.eks.AccessEntry(
      name,
      {
        clusterName: cluster.name,
        principalArn: principalArn,
        type: 'STANDARD',
        tags: tags,
      },
      {
        parent: this,
        dependsOn: [cluster],
      },
    );

    const accessPolicyAssociation = new aws.eks.AccessPolicyAssociation(
      name,
      {
        clusterName: cluster.name,
        principalArn: clusterCreatorAdminPermissions.principalArn,
        policyArn: pulumi.interpolate`arn:${partition}:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy`,
        accessScope: {
          type: 'cluster',
        },
      },
      {
        parent: this,
        dependsOn: [cluster, clusterCreatorAdminPermissions],
      },
    );

    return accessPolicyAssociation.principalArn;
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
