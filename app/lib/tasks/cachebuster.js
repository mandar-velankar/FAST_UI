const processors = require("@ui5/builder").processors;
const tasks = require("@ui5/builder").tasks;
/**
 * Custom task example
 *
 * @param {object} parameters Parameters
 * @param {module:@ui5/fs.DuplexCollection} parameters.workspace DuplexCollection to read and write files
 * @param {module:@ui5/fs.AbstractReader} parameters.dependencies Reader or Collection to read dependency files
 * @param {object} parameters.taskUtil Specification Version dependent interface to a
 *                [TaskUtil]{@link module:@ui5/builder.tasks.TaskUtil} instance
 * @param {object} parameters.options Options
 * @param {string} parameters.options.projectName Project name
 * @param {string} [parameters.options.projectNamespace] Project namespace if available
 * @param {string} [parameters.options.configuration] Task configuration if given in ui5.yaml
 * @returns {Promise<undefined>} Promise resolving with <code>undefined</code> once data has been written
 */
 module.exports = async function({workspace, dependencies, taskUtil, options}) {
     console.log(" add cachebuster token");
    const cachebusterInfoResource = await tasks.generateCachebusterInfo({workspace, dependencies, options:{namespace:options.projectNamespace,signatureType:"time"}});
    const cachebusterInfoResources = await workspace.byGlob("**/sap-ui-cachebuster-info.json");
    if(cachebusterInfoResources.length > 0){
        console.log("found cachebusterinfo")
        let cachebusterInfo = JSON.parse( await cachebusterInfoResources[0].getString() );
        console.log(cachebusterInfo);
    }
    const jsResources = await workspace.byGlob("**/*.js");
    const clonedResources = await processors.resourceCopier({resources:jsResources,options:{pattern:"landing",replacement:"hello"}});
    return await Promise.all(clonedResources.map((resource) => {
        return workspace.write(resource);
    }));
};