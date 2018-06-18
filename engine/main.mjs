import {SystemProperties} from './config/systemProperties.mjs'
import {ServerConfiguration} from './config/serverConfiguration.mjs'
import {Api} from './core/api.mjs'

class System {
    constructor() {}
    start() {
        this.systemProperties = new SystemProperties();
        this.properties = this.systemProperties.properties;
        this.server = new ServerConfiguration( this.properties );
        this.api = new Api( this.server );
    }
}
const system = new System();
system.start();