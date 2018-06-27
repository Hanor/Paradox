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
         *  a;starts;b
         *  c;contains;a
         */
        this.server.app.post('/api/paradox', (req, res) => {
            this.paradoxService.run( req.body.graph ).subscribe(( response ) => {
                if ( response.network ) {
                    res.send( JSON.stringify( response ));
                } else {
                    res.send({err: "Cannot evaluate." });
                }
            })
            // console.log( response )
        })
    }
    test() {
        fs.readFile('engine/resources/graphTest.csv', 'utf8', async (err, data) => {
            if ( !err ) {
                let lines = data.split('\n');
                let graphLines = [];
                lines.splice(0, 1);
                for ( let line of lines ) {
                    graphLines.push( line.split(';'))
                }
                this.paradoxService.run( graphLines ).subscribe((response) => {
                    console.log(response)
                });
            } 
        });
    }
}