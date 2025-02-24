import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsNative from '@pulumi/aws-native';
import * as k8s from '@pulumi/kubernetes';
import { Tags, toNativeTags, getPartition, getRegion, getDnsSuffix, getAccountId, getRoleName, RoleArgs } from './util';
import { getKubeConfig } from './cluster';

/**
 * Configuration options for deploying Karpenter on an EKS cluster.
 */
export interface KarpenterArgs {
    /**
     * The name of the EKS cluster where Karpenter will be deployed.
     */
    clusterName: pulumi.Input<string>;

    /**
     * Configuration for the SQS queue used by Karpenter for node interruption handling.
     */
    queue?: QueueArgs;

    /**
     * The ARN of an existing IAM role to use for the Karpenter controller.
     * If not provided, a role will be created using controllerRoleArgs.
     */
    controllerRoleArn?: pulumi.Input<string>;

    /**
     * Configuration for creating the Karpenter controller IAM role.
     * Only used if controllerRoleArn is not provided.
     */
    controllerRoleArgs?: RoleArgs;

    /**
     * The ARN of an existing IAM role to use for Karpenter-managed nodes.
     * If not provided, a role will be created using nodeRoleArgs.
     */
    nodeRoleArn?: pulumi.Input<string>;

    /**
     * Configuration for creating the Karpenter node IAM role.
     * Only used if nodeRoleArn is not provided.
     */
    nodeRoleArgs?: RoleArgs;

    /**
     * The name of the Kubernetes service account to use for Karpenter.
     * If not provided, a default name ('karpenter') will be used.
     */
    serviceAccount?: pulumi.Input<string>;

    /**
     * Whether to create an EKS access entry for the Karpenter IAM roles.
     */
    createAccessEntry?: pulumi.Input<boolean>;

    /**
     * The kubeconfig to use for deploying Karpenter.
     * If not provided, will be generated from the cluster.
     */
    kubeconfig?: pulumi.Input<string>;

    /**
     * The version of Karpenter to deploy.
     */
    version: pulumi.Input<string>;

    /**
     * Additional values to pass to the Karpenter Helm chart.
     */
    helmValues?: pulumi.Input<object>;

    /**
     * Tags to apply to all resources created by this component.
     */
    tags?: Tags;
}

/**
 * Configuration options for the Karpenter interruption queue.
 * This queue is used to handle EC2 Spot Instance interruption notices and other instance lifecycle events.
 */
export interface QueueArgs {
    /**
     * The name of the SQS queue. If not provided, a name will be generated.
     */
    name?: pulumi.Input<string>;

    /**
     * Whether to enable server-side encryption (SSE) for the queue using SQS-owned encryption keys.
     * When enabled, messages are automatically encrypted at rest.
     */
    managedSseEnabled?: pulumi.Input<boolean>;

    /**
     * The ID of an AWS-managed customer master key (CMK) for Amazon SQS or a custom CMK.
     * Used for server-side encryption if you want to use your own KMS key instead of SQS-owned encryption keys.
     */
    kmsMasterKeyId?: pulumi.Input<string>;

    /**
     * The length of time, in seconds, for which Amazon SQS can reuse a data key to encrypt or decrypt messages.
     * Only used when a custom KMS key is specified. Valid values: 60 seconds to 86,400 seconds (24 hours).
     */
    kmsDataKeyReusePeriodSeconds?: pulumi.Input<number>;

    /**
     * Key-value mapping of tags for the SQS queue.
     */
    tags?: Tags;
}

export class Karpenter extends pulumi.ComponentResource {
    public readonly queueArn: pulumi.Output<string>;
    public readonly controllerRoleName: pulumi.Output<string>;
    public readonly nodeRoleName: pulumi.Output<string>;

    constructor(name: string, args: KarpenterArgs, opts?: pulumi.ComponentResourceOptions) {
        super("aws-k8s:index:Karpenter", name, args, opts);

        const queue = this.createSqsQueue(name, args.queue, args.tags);
        const queuePolicy = this.createSqsQueuePolicy(name, queue);
        this.queueArn = queuePolicy.id.apply(_ => queue.arn);

        const nodeRoleArn = this.createNodeRole(name, args);
        const accessEntry = pulumi.output(args.createAccessEntry).apply(createAccessEntry => {
            if (createAccessEntry ?? true) {
                return new aws.eks.AccessEntry(name, {
                    clusterName: args.clusterName,
                    principalArn: nodeRoleArn,
                    type: "EC2_LINUX",
                    tags: args.tags,
                }, { parent: this });
            }
            return undefined;
        });
        this.nodeRoleName = pulumi.output(accessEntry).apply(_ => getRoleName(nodeRoleArn));

        const controllerRoleArn = this.createControllerRole(name, args, nodeRoleArn);
        this.controllerRoleName = getRoleName(controllerRoleArn);

        const serviceAccount = pulumi.output(args.serviceAccount).apply(sa => sa ?? "karpenter");

        const podIdentityAssociation = new aws.eks.PodIdentityAssociation(name, {
            clusterName: args.clusterName,
            namespace: "kube-system",
            serviceAccount: serviceAccount,
            roleArn: controllerRoleArn,
        }, { parent: this });

        const nodeTerminationEventRules = this.nodeTerminationEventRules(name);

        const kubeconfig = pulumi.output(args.kubeconfig).apply(kubeconfig => {
            if (kubeconfig) {
                return pulumi.output(kubeconfig);
            }
            return getKubeConfig(args.clusterName, { parent: this });
        });
        const k8sProvider = new k8s.Provider(`${name}-k8s`, {
            kubeconfig: kubeconfig,
        }, { parent: this });

        const cluster = aws.eks.getClusterOutput({
            name: args.clusterName,
        }, { parent: this });

        const region = getRegion(this);

        const karpenter = new k8s.helm.v3.Release(`${name}-karpenter`, {
            chart: "oci://public.ecr.aws/karpenter/karpenter",
            version: args.version,
            namespace: "kube-system",
            atomic: true,
            values: pulumi.output(args.helmValues).apply(helmValues => ({
                dnsPolicy: "Default",
                serviceAccount: {
                    name: serviceAccount,
                },
                ...helmValues,
                settings: {
                    clusterName: args.clusterName,
                    clusterEndpoint: cluster.endpoint,
                    interruptionQueue: queue.name,
                    ...((helmValues as any)?.settings ?? {}),
                },
                controller: {
                    env: [{
                        name: "AWS_REGION",
                        value: region,
                    }],
                    resources: {
                        requests: {
                            cpu: "1",
                            memory: "1Gi",
                        },
                        limits: {
                            cpu: "1",
                            memory: "1Gi",
                        },
                    },
                    ...((helmValues as any)?.controller ?? {}),
                }
            })),
        }, { parent: this, provider: k8sProvider, dependsOn: [podIdentityAssociation] });

        this.registerOutputs({
            queueArn: this.queueArn,
            controllerRoleName: this.controllerRoleName,
            nodeRoleName: this.nodeRoleName,
        });
    }

    createControllerRole(name: string, args: KarpenterArgs, nodeRoleArn: pulumi.Output<string>): pulumi.Output<string> {
        if (args.controllerRoleArn) {
            return pulumi.output(args.controllerRoleArn);
        }

        const dnsSuffix = getDnsSuffix(this);
        const controllerPolicy = new aws.iam.Policy(`${name}-controller-policy`, {
            description: "Policy for the Karpenter controller",
            policy: this.controllerPolicyDocument(args, nodeRoleArn),
            tags: pulumi.all([args.tags, args.controllerRoleArgs?.tags]).apply(([tags, controllerRoleTags]) => ({ ...tags, ...controllerRoleTags })),
        }, { parent: this });

        const role = new awsNative.iam.Role(`${name}-controller-role`, {
            roleName: args.controllerRoleArgs?.name,
            description: args.controllerRoleArgs?.description,
            path: args.controllerRoleArgs?.path,
            maxSessionDuration: args.controllerRoleArgs?.maxSessionDuration,
            permissionsBoundary: args.controllerRoleArgs?.permissionsBoundary,

            assumeRolePolicyDocument: {
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: pulumi.interpolate`pods.eks.${dnsSuffix}`,
                    },
                    Action: ["sts:AssumeRole", "sts:TagSession"],
                }],
            },

            managedPolicyArns: pulumi.output(args.controllerRoleArgs?.additionalManagedPolicyArns).apply(additionalManagedPolicyArns => [...(additionalManagedPolicyArns ?? []), controllerPolicy.arn]),

            tags: pulumi.all([args.tags, args.controllerRoleArgs?.tags]).apply(([tags, controllerRoleTags]) => (toNativeTags({ ...tags, ...controllerRoleTags })!)),
        }, { parent: this });

        return role.arn;
    }

    createNodeRole(name: string, args: KarpenterArgs): pulumi.Output<string> {
        if (args.nodeRoleArn) {
            return pulumi.output(args.nodeRoleArn);
        }

        const partition = getPartition(this);
        const accountId = getAccountId(this);
        const managedPolicyArns = [
            "AmazonEKS_CNI_Policy",
            "AmazonEKSWorkerNodePolicy",
            "AmazonEC2ContainerRegistryReadOnly",
        ].map(policyName => pulumi.interpolate`arn:${partition}:iam::aws:policy/${policyName}`);

        const cluster = aws.eks.getClusterOutput({
            name: args.clusterName,
        }, { parent: this });

        // The IPv6 policy is not an AWS managed policy, instead it's created in the user account once
        // the first IPv6 cluster is created.
        const ipv6Policy = cluster.kubernetesNetworkConfigs.apply(kubernetesNetworkConfigs => {
            if (kubernetesNetworkConfigs.length > 0) {
                const kubernetesNetworkConfig = kubernetesNetworkConfigs[0];
                if (kubernetesNetworkConfig.ipFamily === "ipv6") {
                    return pulumi.interpolate`arn:${partition}:iam::${accountId}:policy/AmazonEKS_CNI_IPv6_Policy`;
                }
            }
            return [];
        });

        const role = new awsNative.iam.Role(`${name}-node-role`, {
            roleName: pulumi.output(args.nodeRoleArgs?.name).apply(name => name ? pulumi.output(name) : pulumi.interpolate`Karpenter-${args.clusterName}`),
            description: args.nodeRoleArgs?.description,
            path: args.nodeRoleArgs?.path,
            maxSessionDuration: args.nodeRoleArgs?.maxSessionDuration,
            permissionsBoundary: args.nodeRoleArgs?.permissionsBoundary,

            assumeRolePolicyDocument: {
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: pulumi.interpolate`ec2.${getDnsSuffix(this)}`,
                    },
                    Action: ["sts:AssumeRole", "sts:TagSession"],
                }],
            },

            managedPolicyArns: pulumi.all([args.nodeRoleArgs?.additionalManagedPolicyArns, ipv6Policy]).apply(([additionalManagedPolicyArns, ipv6Policy]) => [...(additionalManagedPolicyArns ?? []), ...ipv6Policy, ...managedPolicyArns]),

            tags: pulumi.all([args.tags, args.nodeRoleArgs?.tags]).apply(([tags, nodeRoleTags]) => (toNativeTags({ ...tags, ...nodeRoleTags })!)),
        }, { parent: this });

        return role.arn;
    }

    createSqsQueue(name: string, args: QueueArgs | undefined, parentTags: Tags | undefined): aws.sqs.Queue {
        if (args?.managedSseEnabled && (args?.kmsMasterKeyId || args?.kmsDataKeyReusePeriodSeconds)) {
            throw new pulumi.InputPropertyError({
                propertyPath: "queue.managedSseEnabled",
                reason: "kmsMasterKeyId and kmsDataKeyReusePeriodSeconds must not be set if managedSseEnabled is true",
            });
        }

        const sqsManagedSseEnabled = pulumi.all([args?.managedSseEnabled, args?.kmsMasterKeyId, args?.kmsDataKeyReusePeriodSeconds]).apply(([managedSseEnabled, kmsMasterKeyId, kmsDataKeyReusePeriodSeconds]) => {
            if (managedSseEnabled) {
                return true;
            } else if (kmsMasterKeyId || kmsDataKeyReusePeriodSeconds) {
                return false;
            } else {
                // default to true
                return true;
            }
        });
        const queue = new aws.sqs.Queue(name, {
            name: args?.name,
            sqsManagedSseEnabled,
            kmsMasterKeyId: args?.kmsMasterKeyId,
            kmsDataKeyReusePeriodSeconds: args?.kmsDataKeyReusePeriodSeconds,
            tags: pulumi.all([args?.tags, parentTags]).apply(([tags, parentTags]) => ({ ...parentTags, ...tags })),
        }, { parent: this });

        return queue;
    }

    createSqsQueuePolicy(name: string, queue: aws.sqs.Queue): aws.sqs.QueuePolicy {
        return new aws.sqs.QueuePolicy(name, {
            queueUrl: queue.url,
            policy: this.sqsQueuePolicyDocument(),
        }, { parent: this });
    }

    nodeTerminationEventRules(name: string): pulumi.Output<{ ruleArn: string, targetArn: string }>[] {
        const events = {
            HealthEvent: {
                description: "Karpenter interrupt - AWS health event",
                eventPattern: {
                    source: ["aws.health"],
                    detailType: ["AWS Health Event"]
                }
            },
            SpotInterrupt: {
                description: "Karpenter interrupt - EC2 spot instance interruption warning",
                eventPattern: {
                    source: ["aws.ec2"],
                    detailType: ["EC2 Spot Instance Interruption Warning"]
                }
            },
            InstanceRebalance: {
                description: "Karpenter interrupt - EC2 instance rebalance recommendation", 
                eventPattern: {
                    source: ["aws.ec2"],
                    detailType: ["EC2 Instance Rebalance Recommendation"]
                }
            },
            InstanceStateChange: {
                description: "Karpenter interrupt - EC2 instance state-change notification",
                eventPattern: {
                    source: ["aws.ec2"],
                    detailType: ["EC2 Instance State-change Notification"]
                }
            },
        };

        return Object.entries(events).map(([key, event]) => {
            const rule = new aws.cloudwatch.EventRule(`${name}-${key}`, {
                name: key,
                description: event.description,
                eventPattern: pulumi.jsonStringify(event.eventPattern),
            }, { parent: this });

            const target = new aws.cloudwatch.EventTarget(`${name}-${key}`, {
                rule: rule.name,
                arn: this.queueArn,
                targetId: "KarpenterInterruptionQueueTarget",
            }, { parent: this, dependsOn: [rule] });

            return pulumi.all([rule.arn, target.arn]).apply(([ruleArn, targetArn]) => ({
                ruleArn,
                targetArn,
            }));
        });
    }

    sqsQueuePolicyDocument(): pulumi.Output<string> {
        const dnsSuffix = getDnsSuffix(this);
        return aws.iam.getPolicyDocumentOutput({
            statements: [
                {
                    sid: "SqsWrite",
                    effect: "Allow",
                    actions: ["sqs:SendMessage"],
                    resources: [this.queueArn],
                    principals: [{
                        type: "Service",
                        identifiers: [
                            pulumi.interpolate`events.${dnsSuffix}`,
                            pulumi.interpolate`sqs.${dnsSuffix}`
                        ]
                    }]
                },
                {
                    sid: "DenyHTTP",
                    effect: "Deny", 
                    actions: ["sqs:*"],
                    resources: [this.queueArn],
                    principals: [{
                        type: "*",
                        identifiers: ["*"]
                    }],
                    conditions: [{
                        test: "StringEquals",
                        variable: "aws:SecureTransport",
                        values: ["false"]
                    }]
                }
            ]
        }, { parent: this }).json;
    }

    controllerPolicyDocument(args: KarpenterArgs, nodeRoleArn: pulumi.Output<string>): pulumi.Output<string> {
        const partition = getPartition(this);
        const region = getRegion(this);
        const dnsSuffix = getDnsSuffix(this);
        return aws.iam.getPolicyDocumentOutput({
            statements: [
                {
                    sid: "AllowScopedEC2InstanceAccessActions",
                    effect: "Allow",
                    resources: [
                        pulumi.interpolate`arn:${partition}:ec2:${region}::image/*`,
                        pulumi.interpolate`arn:${partition}:ec2:${region}::snapshot/*`, 
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:security-group/*`,
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:subnet/*`,
                    ],
                    actions: [
                        "ec2:RunInstances",
                        "ec2:CreateFleet"
                    ]
                },
                {
                    sid: "AllowScopedEC2LaunchTemplateAccessActions",
                    effect: "Allow", 
                    resources: [
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:launch-template/*`
                    ],
                    actions: [
                        "ec2:RunInstances",
                        "ec2:CreateFleet"
                    ],
                    conditions: [
                        {
                            test: "StringEquals",
                            variable: pulumi.interpolate`aws:ResourceTag/kubernetes.io/cluster/${args.clusterName}`,
                            values: ["owned"]
                        },
                        {
                            test: "StringLike", 
                            variable: "aws:ResourceTag/karpenter.sh/nodepool",
                            values: ["*"]
                        }
                    ]
                },
                {
                    sid: "AllowScopedEC2InstanceActionsWithTags",
                    effect: "Allow",
                    resources: [
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:fleet/*`,
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:instance/*`, 
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:volume/*`,
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:network-interface/*`,
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:launch-template/*`,
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:spot-instances-request/*`,
                    ],
                    actions: [
                        "ec2:RunInstances",
                        "ec2:CreateFleet",
                        "ec2:CreateLaunchTemplate"
                    ],
                    conditions: [
                        {
                            test: "StringEquals",
                            variable: pulumi.interpolate`aws:RequestTag/kubernetes.io/cluster/${args.clusterName}`,
                            values: ["owned"]
                        },
                        {
                            test: "StringEquals", 
                            variable: pulumi.interpolate`aws:RequestTag/eks:eks-cluster-name`,
                            values: [args.clusterName]
                        },
                        {
                            test: "StringLike",
                            variable: "aws:RequestTag/karpenter.sh/nodepool",
                            values: ["*"]
                        }
                    ]
                },
                {
                    sid: "AllowScopedResourceCreationTagging",
                    effect: "Allow",
                    resources: [
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:fleet/*`,
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:instance/*`,
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:volume/*`, 
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:network-interface/*`,
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:launch-template/*`,
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:spot-instances-request/*`,
                    ],
                    actions: ["ec2:CreateTags"],
                    conditions: [
                        {
                            test: "StringEquals",
                            variable: pulumi.interpolate`aws:RequestTag/kubernetes.io/cluster/${args.clusterName}`,
                            values: ["owned"]
                        },
                        {
                            test: "StringEquals",
                            variable: pulumi.interpolate`aws:RequestTag/eks:eks-cluster-name`,
                            values: [args.clusterName]
                        },
                        {
                            test: "StringEquals",
                            variable: "ec2:CreateAction",
                            values: [
                                "RunInstances",
                                "CreateFleet", 
                                "CreateLaunchTemplate"
                            ]
                        },
                        {
                            test: "StringLike",
                            variable: "aws:RequestTag/karpenter.sh/nodepool",
                            values: ["*"]
                        }
                    ]
                },
                {
                    sid: "AllowScopedResourceTagging",
                    effect: "Allow",
                    resources: [
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:instance/*`
                    ],
                    actions: ["ec2:CreateTags"],
                    conditions: [
                        {
                            test: "StringEquals",
                            variable: pulumi.interpolate`aws:ResourceTag/kubernetes.io/cluster/${args.clusterName}`,
                            values: ["owned"]
                        },
                        {
                            test: "StringLike", 
                            variable: "aws:ResourceTag/karpenter.sh/nodepool",
                            values: ["*"]
                        },
                        {
                            test: "StringEqualsIfExists",
                            variable: "aws:RequestTag/eks:eks-cluster-name",
                            values: [args.clusterName]
                        },
                        {
                            test: "ForAllValues:StringEquals",
                            variable: "aws:TagKeys",
                            values: [
                                "eks:eks-cluster-name",
                                "karpenter.sh/nodeclaim",
                                "Name"
                            ]
                        }
                    ]
                },
                {
                    sid: "AllowScopedDeletion",
                    effect: "Allow",
                    resources: [
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:instance/*`,
                        pulumi.interpolate`arn:${partition}:ec2:${region}:*:launch-template/*`
                    ],
                    actions: [
                        "ec2:TerminateInstances",
                        "ec2:DeleteLaunchTemplate"
                    ],
                    conditions: [
                        {
                            test: "StringEquals",
                            variable: pulumi.interpolate`aws:ResourceTag/kubernetes.io/cluster/${args.clusterName}`,
                            values: ["owned"]
                        },
                        {
                            test: "StringLike",
                            variable: "aws:ResourceTag/karpenter.sh/nodepool",
                            values: ["*"]
                        }
                    ]
                },
                {
                    sid: "AllowRegionalReadActions",
                    effect: "Allow",
                    resources: ["*"],
                    actions: [
                        "ec2:DescribeAvailabilityZones",
                        "ec2:DescribeImages", 
                        "ec2:DescribeInstances",
                        "ec2:DescribeInstanceTypeOfferings",
                        "ec2:DescribeInstanceTypes",
                        "ec2:DescribeLaunchTemplates",
                        "ec2:DescribeSecurityGroups",
                        "ec2:DescribeSpotPriceHistory",
                        "ec2:DescribeSubnets"
                    ],
                    conditions: [
                        {
                            test: "StringEquals",
                            variable: "aws:RequestedRegion",
                            values: [region]
                        }
                    ]
                },
                {
                    sid: "AllowSSMReadActions",
                    effect: "Allow",
                    resources: [pulumi.interpolate`arn:${partition}:ssm:${region}::parameter/aws/service/*`],
                    actions: ["ssm:GetParameter"]
                },
                {
                    sid: "AllowPricingReadActions", 
                    effect: "Allow",
                    resources: ["*"],
                    actions: ["pricing:GetProducts"]
                },
                {
                    sid: "AllowInterruptionQueueActions",
                    effect: "Allow", 
                    resources: [this.queueArn],
                    actions: [
                        "sqs:DeleteMessage",
                        "sqs:GetQueueUrl", 
                        "sqs:ReceiveMessage"
                    ]
                },
                {
                    sid: "AllowPassingInstanceRole",
                    effect: "Allow",
                    resources: [nodeRoleArn],
                    actions: ["iam:PassRole"],
                    conditions: [{
                        test: "StringEquals",
                        variable: "iam:PassedToService", 
                        values: [pulumi.interpolate`ec2.${dnsSuffix}`]
                    }]
                },
                {
                    sid: "AllowScopedInstanceProfileCreationActions",
                    effect: "Allow",
                    resources: [pulumi.interpolate`arn:${partition}:iam::*:instance-profile/*`],
                    actions: ["iam:CreateInstanceProfile"],
                    conditions: [
                        {
                            test: "StringEquals",
                            variable: pulumi.interpolate`aws:RequestTag/kubernetes.io/cluster/${args.clusterName}`,
                            values: ["owned"]
                        },
                        {
                            test: "StringEquals", 
                            variable: pulumi.interpolate`aws:RequestTag/eks:eks-cluster-name`,
                            values: [args.clusterName]
                        },
                        {
                            test: "StringEquals",
                            variable: "aws:RequestTag/topology.kubernetes.io/region",
                            values: [region]
                        },
                        {
                            test: "StringLike",
                            variable: "aws:RequestTag/karpenter.k8s.aws/ec2nodeclass",
                            values: ["*"]
                        }
                    ]
                },
                {
                    sid: "AllowScopedInstanceProfileTagActions",
                    effect: "Allow", 
                    resources: [pulumi.interpolate`arn:${partition}:iam::*:instance-profile/*`],
                    actions: ["iam:TagInstanceProfile"],
                    conditions: [
                        {
                            test: "StringEquals",
                            variable: pulumi.interpolate`aws:ResourceTag/kubernetes.io/cluster/${args.clusterName}`,
                            values: ["owned"]
                        },
                        {
                            test: "StringEquals",
                            variable: "aws:ResourceTag/topology.kubernetes.io/region",
                            values: [region]
                        },
                        {
                            test: "StringEquals",
                            variable: pulumi.interpolate`aws:RequestTag/kubernetes.io/cluster/${args.clusterName}`,
                            values: ["owned"]
                        },
                        {
                            test: "StringEquals",
                            variable: pulumi.interpolate`aws:RequestTag/eks:eks-cluster-name`,
                            values: [args.clusterName]
                        },
                        {
                            test: "StringEquals",
                            variable: "aws:RequestTag/topology.kubernetes.io/region",
                            values: [region]
                        },
                        {
                            test: "StringLike",
                            variable: "aws:ResourceTag/karpenter.k8s.aws/ec2nodeclass",
                            values: ["*"]
                        },
                        {
                            test: "StringLike",
                            variable: "aws:RequestTag/karpenter.k8s.aws/ec2nodeclass",
                            values: ["*"]
                        }
                    ]
                },
                {
                    sid: "AllowScopedInstanceProfileActions",
                    effect: "Allow",
                    resources: [pulumi.interpolate`arn:${partition}:iam::*:instance-profile/*`],
                    actions: [
                        "iam:AddRoleToInstanceProfile",
                        "iam:RemoveRoleFromInstanceProfile", 
                        "iam:DeleteInstanceProfile"
                    ],
                    conditions: [
                        {
                            test: "StringEquals",
                            variable: pulumi.interpolate`aws:ResourceTag/kubernetes.io/cluster/${args.clusterName}`,
                            values: ["owned"]
                        },
                        {
                            test: "StringEquals",
                            variable: "aws:ResourceTag/topology.kubernetes.io/region",
                            values: [region]
                        },
                        {
                            test: "StringLike",
                            variable: "aws:ResourceTag/karpenter.k8s.aws/ec2nodeclass",
                            values: ["*"]
                        }
                    ]
                },
                {
                    sid: "AllowInstanceProfileReadActions",
                    effect: "Allow",
                    resources: [pulumi.interpolate`arn:${partition}:iam::*:instance-profile/*`],
                    actions: ["iam:GetInstanceProfile"]
                },
                {
                    sid: "AllowAPIServerEndpointDiscovery",
                    effect: "Allow",
                    resources: [pulumi.interpolate`arn:${partition}:eks:${region}:*:cluster/${args.clusterName}`],
                    actions: ["eks:DescribeCluster"]
                },
            ]
        }, { parent: this }).json;
    }
}
