import { ParadoxService } from './paradoxService.mjs';

/*
    for test...
 */
import fs from 'fs';

export class ParadoxRest {
    constructor( server ) {
        this.server = server;
        this.paradoxService = new ParadoxService( );
        this.methods();
        this.test();
    }
    methods() {
        /*
         * To use this end point you need to pass something like:
         *  b;
         *  c;
         *  a;before;b
         *  a;during;c
         */
        this.server.app.post('/api/paradox', (req, res) => {
            this.paradoxService.run( req.params.graph );
            res.send('WHAT');
        })
    }
    test() {
        fs.readFile('engine/resources/graphTest.csv', 'utf8', (err, data) => {
            if ( !err ) {
                let lines = data.split('\n');
                let graphLines = [];
                lines.splice(0, 1);
                for ( let line of lines ) {
                    graphLines.push( line.split(';'))
                }
                let response = this.paradoxService.run( graphLines );
                console.log(response)
            } 
        });
    }
}