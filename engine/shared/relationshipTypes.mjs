
import fs   from 'fs'
import rxjs from 'rxjs';
/*
 *  I know, have a ciclic dependenci in equal type and during type then be slow!! Little locust! 
 */
export class RelationshipTypes {
    constructor() {
        this.done = new rxjs.BehaviorSubject();
        this.types = {};
        this.processFile();
        this.buildTable();
    }
    buildTable() {
            
    }

    linkTheReversed() {
        this.types[ 'all' ] = { value: '' };
        let keys = Object.keys( this.types );
        for ( let key of keys ) {
            let type = this.types[ key ];
            if ( type.reversed ) {
                type.reversed = this.types[ type.reversed ];
                if ( !type.reversed ) {
                    console.error( type );
                    console.error('Reversed not found!');
                }
                this.types[ 'all' ].value += key;
            }
        }
    }

    processFile() {
        let i = 0;
        fs.readFile('engine/resources/transitiveTableAndRelationships.csv', 'utf8', (err, data) => {
            if (err) {
                return console.log(err);
            } 

            let lines = data.split('\n');
            let header = lines[0];
            let values = header.split(';');
            for ( let i = 0; i < values.length; i += 3 ) {
                let label = values[ i ];
                let reversedLabel = values[ i + 1];
                let labelValue = values[ i + 2 ]

                this.types[ label ] = { value: labelValue, reversed: reversedLabel };
            }

            this.linkTheReversed();
            this.done.next( true );
        });
    }
}