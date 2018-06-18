import express from 'express'
import morgan from 'morgan'      
import bodyParser from 'body-parser'
import methodOverride from 'method-override'

export class ServerConfiguration {
    constructor( config ) {
        this.port = ( process.env.PORT || config.server.port );
        this.app = express();
        this.app.listen( this.port )
        this.app.use('', express.static( config.server.files ));
        this.app.use('*', express.static( config.server.files ));
        this.app.use(morgan('dev'));
        this.app.use(bodyParser.urlencoded({'extended':'true'}));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
        this.app.use(methodOverride())
    }
}
