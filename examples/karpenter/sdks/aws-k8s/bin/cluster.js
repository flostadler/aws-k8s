"use strict";
// *** WARNING: this file was generated by pulumi-language-nodejs. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cluster = void 0;
const pulumi = require("@pulumi/pulumi");
const utilities = require("./utilities");
class Cluster extends pulumi.ComponentResource {
    /**
     * Returns true if the given object is an instance of Cluster.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj) {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === Cluster.__pulumiType;
    }
    /**
     * Create a Cluster resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name, args, opts) {
        let resourceInputs = {};
        opts = opts || {};
        if (!opts.id) {
            if ((!args || args.vpcConfig === undefined) && !opts.urn) {
                throw new Error("Missing required property 'vpcConfig'");
            }
            resourceInputs["addons"] = args ? args.addons : undefined;
            resourceInputs["autoMode"] = args ? args.autoMode : undefined;
            resourceInputs["encryptionKeyArn"] = args ? args.encryptionKeyArn : undefined;
            resourceInputs["name"] = args ? args.name : undefined;
            resourceInputs["networkConfig"] = args ? args.networkConfig : undefined;
            resourceInputs["roleArn"] = args ? args.roleArn : undefined;
            resourceInputs["supportType"] = args ? args.supportType : undefined;
            resourceInputs["tags"] = args ? args.tags : undefined;
            resourceInputs["version"] = args ? args.version : undefined;
            resourceInputs["vpcConfig"] = args ? args.vpcConfig : undefined;
            resourceInputs["zonalShiftConfig"] = args ? args.zonalShiftConfig : undefined;
            resourceInputs["clusterAdmins"] = undefined /*out*/;
            resourceInputs["clusterRoleArn"] = undefined /*out*/;
            resourceInputs["clusterSecurityGroupId"] = undefined /*out*/;
            resourceInputs["eksCluster"] = undefined /*out*/;
            resourceInputs["installedAddons"] = undefined /*out*/;
        }
        else {
            resourceInputs["clusterAdmins"] = undefined /*out*/;
            resourceInputs["clusterRoleArn"] = undefined /*out*/;
            resourceInputs["clusterSecurityGroupId"] = undefined /*out*/;
            resourceInputs["eksCluster"] = undefined /*out*/;
            resourceInputs["encryptionKeyArn"] = undefined /*out*/;
            resourceInputs["installedAddons"] = undefined /*out*/;
        }
        opts = pulumi.mergeOptions(utilities.resourceOptsDefaults(), opts);
        super(Cluster.__pulumiType, name, resourceInputs, opts, true /*remote*/);
    }
}
exports.Cluster = Cluster;
/** @internal */
Cluster.__pulumiType = 'aws-k8s:index:Cluster';
//# sourceMappingURL=cluster.js.map