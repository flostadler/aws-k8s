"use strict";
// *** WARNING: this file was generated by pulumi-language-nodejs. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildkitCerts = void 0;
const pulumi = require("@pulumi/pulumi");
const utilities = require("./utilities");
class BuildkitCerts extends pulumi.ComponentResource {
    /**
     * Returns true if the given object is an instance of BuildkitCerts.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj) {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === BuildkitCerts.__pulumiType;
    }
    /**
     * Create a BuildkitCerts resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name, args, opts) {
        let resourceInputs = {};
        opts = opts || {};
        if (!opts.id) {
            resourceInputs["caSubject"] = args ? args.caSubject : undefined;
            resourceInputs["keyAlgorithm"] = args ? args.keyAlgorithm : undefined;
            resourceInputs["serverDNSNames"] = args ? args.serverDNSNames : undefined;
            resourceInputs["serverIPAddresses"] = args ? args.serverIPAddresses : undefined;
            resourceInputs["caCertPem"] = undefined /*out*/;
            resourceInputs["caCertPublicKeyPem"] = undefined /*out*/;
            resourceInputs["clientCertPem"] = undefined /*out*/;
            resourceInputs["clientPrivateKeyPem"] = undefined /*out*/;
            resourceInputs["serverCertPem"] = undefined /*out*/;
            resourceInputs["serverPrivateKeyPem"] = undefined /*out*/;
        }
        else {
            resourceInputs["caCertPem"] = undefined /*out*/;
            resourceInputs["caCertPublicKeyPem"] = undefined /*out*/;
            resourceInputs["clientCertPem"] = undefined /*out*/;
            resourceInputs["clientPrivateKeyPem"] = undefined /*out*/;
            resourceInputs["serverCertPem"] = undefined /*out*/;
            resourceInputs["serverPrivateKeyPem"] = undefined /*out*/;
        }
        opts = pulumi.mergeOptions(utilities.resourceOptsDefaults(), opts);
        super(BuildkitCerts.__pulumiType, name, resourceInputs, opts, true /*remote*/);
    }
}
exports.BuildkitCerts = BuildkitCerts;
/** @internal */
BuildkitCerts.__pulumiType = 'aws-k8s:index:BuildkitCerts';
//# sourceMappingURL=buildkitCerts.js.map