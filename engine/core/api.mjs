import { ParadoxRest } from '../paradox/paradoxRest.mjs'

export class Api {
    constructor( server ) {
        this.server = server;
        this.register = [];
        this.init();
    }
    init() {
        this.register.push( new ParadoxRest( this.server ));
    }
}