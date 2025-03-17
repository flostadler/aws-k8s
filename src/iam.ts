import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { getAccountId, getPartition } from './util';

/**
 * Configuration for creating an IAM role for service accounts (IRSA).
 * Extends the standard IAM role arguments but handles the trust relationship automatically.
 */
export interface IrsaRoleArgs {
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
  inlinePolicies?: pulumi.Input<pulumi.Input<aws.types.input.iam.RoleInlinePolicy>[]>;
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
   * Key-value mapping of tags for the IAM role. If configured with a provider `defaultTags` configuration block present, tags with matching keys will overwrite those defined at the provider-level.
   */
  tags?: pulumi.Input<{
    [key: string]: pulumi.Input<string>;
  }>;

  /**
   * The name of the EKS cluster where the service accounts exist.
   * Used to configure the OIDC provider trust relationship.
   */
  clusterName: pulumi.Input<string>;

  /**
   * List of Kubernetes service accounts that can assume this role.
   * Each service account is identified by its namespace and name.
   */
  serviceAccounts?: pulumi.Input<pulumi.Input<NamespacedServiceAccount>[]>;
}

/**
 * Represents a Kubernetes service account with its namespace.
 */
export interface NamespacedServiceAccount {
  /**
   * The Kubernetes namespace where the service account exists.
   */
  namespace: pulumi.Input<string>;

  /**
   * The name of the Kubernetes service account.
   */
  serviceAccount: pulumi.Input<string>;
}

/**
 * IrsaRole creates an IAM role that can be assumed by Kubernetes service accounts (IRSA).
 * It automatically configures the trust relationship between the IAM role and the EKS cluster's OIDC provider.
 *
 * The role can be assumed by one or more Kubernetes service accounts specified in the args.
 * The trust relationship is configured to only allow the specified service accounts to assume the role.
 */
export class IrsaRole extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  constructor(
    name: string,
    args: IrsaRoleArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super(name, 'aws-k8s:index:IrsaRole', args, opts);

    const oidcIssuer = this.getClusterOidcIssuer(args.clusterName);
    const accountId = getAccountId(this);
    const partition = getPartition(this);

    const audTest = {
      test: 'StringEquals',
      variable: pulumi.interpolate`${oidcIssuer}:aud`,
      values: ['sts.amazonaws.com'],
    };

    const subTests = pulumi
      .output(args.serviceAccounts)
      .apply((serviceAccounts) => {
        return (serviceAccounts ?? []).map((sa) => {
          return {
            test: 'StringEquals',
            variable: pulumi.interpolate`${oidcIssuer}:sub`,
            values: [
              pulumi.interpolate`system:serviceaccount:${sa.namespace}:${sa.serviceAccount}`,
            ],
          };
        });
      });

    const trustRelationship = aws.iam.getPolicyDocumentOutput(
      {
        statements: [
          {
            actions: ['sts:AssumeRoleWithWebIdentity'],
            principals: [
              {
                type: 'Federated',
                identifiers: [
                  pulumi.interpolate`arn:${partition}:iam::${accountId}:oidc-provider/${oidcIssuer}`,
                ],
              },
            ],
            conditions: subTests.apply((subTests) => [...subTests, audTest]),
          },
        ],
      },
      { parent: this },
    ).json;

    this.role = new aws.iam.Role(
      name,
      {
        assumeRolePolicy: trustRelationship,
        ...args,
      },
      { parent: this },
    );

    this.registerOutputs({
      role: this.role,
    });
  }

  getClusterOidcIssuer(
    clusterName: pulumi.Input<string>,
  ): pulumi.Output<string> {
    const cluster = aws.eks.getClusterOutput(
      {
        name: clusterName,
      },
      { parent: this },
    );

    return cluster.identities.apply((identities) => {
      if (identities.length === 0) {
        throw new pulumi.ResourceError(
          `No identities found for cluster ${clusterName}`,
          this,
        );
      }

      if (identities[0].oidcs.length === 0) {
        throw new pulumi.ResourceError(
          `No OIDC issuers found for cluster ${clusterName}`,
          this,
        );
      }

      return identities[0].oidcs[0].issuer;
    });
  }
}
