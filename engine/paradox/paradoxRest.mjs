import { ParadoxService } from './paradoxService.mjs';

export class ParadoxRest {
    constructor( server ) {
        this.server = server;
        this.paradoxService = new ParadoxService();
        this.methods();
        this.paradoxService.run();
    }
    methods() {
        this.server.app.get('/api/paradox', (req, res) => {
            this.paradoxService.run();
            res.send('WHAT');
        })
    }
}