export class Api {
    constructor( server ) {
        this.server = server;
        this.init();
    }
    init() {
        this.rest = new DefaultRest( this.server );
    }
}
class DefaultRest {
    constructor( server ) {
        this.server = server;
        this.methods();
    }
    methods() {
        this.server.app.get('/api/test', (req, res) => {
            return res.send( 'Paradox...' );
        })
    }
}