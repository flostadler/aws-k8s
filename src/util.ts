import * as aws from '@pulumi/aws';
import * as awsNative from '@pulumi/aws-native';
import * as pulumi from '@pulumi/pulumi';

export type Tags = pulumi.Input<{ [key: string]: pulumi.Input<string> }>;

/**
 * Configuration for creating an IAM role.
 */
export interface RoleArgs {
  /**
   * The name of the role. If not provided, a name will be generated.
   */
  name?: pulumi.Input<string>;

  /**
   * The description of the role.
   */
  description?: pulumi.Input<string>;

  /**
   * The path to the role. Defaults to "/".
   */
  path?: pulumi.Input<string>;

  /**
   * The maximum session duration (in seconds) that you want to set for the role.
   * This setting can have a value from 1 hour (3600) to 12 hours (43200).
   */
  maxSessionDuration?: pulumi.Input<number>;

  /**
   * The ARN of the policy that is used to set the permissions boundary for the role.
   */
  permissionsBoundary?: pulumi.Input<string>;

  /**
   * Additional managed policy ARNs to attach to the role.
   */
  additionalManagedPolicyArns?: pulumi.Input<pulumi.Input<string>[]>;

  /**
   * Key-value mapping of tags for the role.
   */
  tags?: Tags;
}

export function getPartition(
  parent?: pulumi.ComponentResource,
  opts?: pulumi.InvokeOptions,
): pulumi.Output<string> {
  return pulumi.output(
    aws.getPartitionOutput({}, { parent: parent, ...opts }).partition,
  );
}

export function getRegion(
  parent?: pulumi.ComponentResource,
  opts?: pulumi.InvokeOptions,
): pulumi.Output<string> {
  return pulumi.output(
    aws.getRegionOutput({}, { parent: parent, ...opts }).name,
  );
}

export function getAccountId(
  parent?: pulumi.ComponentResource,
  opts?: pulumi.InvokeOptions,
): pulumi.Output<string> {
  return pulumi.output(
    aws.getCallerIdentityOutput({}, { parent: parent, ...opts }).accountId,
  );
}

export function getDnsSuffix(
  parent?: pulumi.ComponentResource,
  opts?: pulumi.InvokeOptions,
): pulumi.Output<string> {
  return pulumi.output(
    aws.getPartitionOutput({}, { parent: parent, ...opts }).dnsSuffix,
  );
}

export function toNativeTags(
  tags: Tags | undefined,
): pulumi.Output<awsNative.types.input.TagArgs[]> | undefined {
  if (!tags) {
    return undefined;
  }
  return pulumi
    .output(tags)
    .apply((tagMap) =>
      Object.entries(tagMap).map(([key, value]) => ({ key, value })),
    );
}

export function getClusterOidcIssuer(
  clusterName: pulumi.Input<string>,
  parent: pulumi.ComponentResource,
): pulumi.Output<string> {
  return aws.eks
    .getClusterOutput({ name: clusterName }, { parent: parent })
    .identities.apply((identities) => identities[0].oidcs[0].issuer);
}

export function getRoleName(arn: pulumi.Input<string>): pulumi.Output<string> {
  return pulumi.output(arn).apply((arnStr) => arnStr.split('/').pop()!);
}
