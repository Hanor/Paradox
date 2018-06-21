
import fs   from 'fs'
import rxjs from 'rxjs';
/*
 *  I know, have a ciclic dependenci in equal type and during type then be slow!! Little locust! 
 */
export class RelationshipTypes {
    constructor() {
        this.state = new rxjs.BehaviorSubject();
        this.typesName = {};
        this.types = {};
        this.table = {};
        this.processFile();
    }
    buildTable( headers, columns, lines ) {
        const all = [];
        for ( let line of lines ) {
            let values =  line.split(';');
            let lineNumber = values.splice(0, 1)[0];
            this.table[ lineNumber ] = [];
            all.push( lineNumber );
            for ( let i = 0; i < values.length; i++ ) {
                let relations = values[i].replace('\r', '').split('|');
                this.table[ lineNumber ].push(relations);
            }
        }
        this.types[ 'all' ] = { value: 'all', name: 'all', reversed: 'all' };
        this.table[ 'all' ] = all;
        for ( let i = 0; i < columns.length; i += 3 ) {
            let name = columns[i];
            let number = columns[i+2];
            this.typesName[ name ] = number;
        }
    }

    linkTheReversed() {
        let keys = Object.keys( this.types );
        for ( let key of keys ) {
            let type = this.types[ key ];
            if ( type.reversed ) {
                type.reversed = this.types[ type.reversed ];
                if ( !type.reversed ) {
                    console.error( type );
                    console.error('Reversed not found!');
                }
            }
        }
    }

    processFile() {
        let i = 0;
        fs.readFile('engine/resources/transitiveTableAndRelationships.csv', 'utf8', (err, data) => {
            if (err) {
                return console.log(err);
            } 

            const lines = data.split('\n');
            let columns = lines.splice(0, 1)[0].replace('\r', '');
            let headers = lines.splice(0, 1)[0].replace('\r', '');
            let headerValues = headers.split(';');
            let columnsValues = columns.split(';');
            for ( let i = 0; i < columnsValues.length; i += 3 ) {
                let label = columnsValues[ i ];
                let reversedLabel = columnsValues[ i + 1];
                let labelValue = columnsValues[ i + 2 ]

                this.types[ labelValue.trim() ] = { name: label, value: labelValue.trim(), reversed: reversedLabel };
            }
            
            this.buildTable( headerValues, columnsValues, lines );
            this.linkTheReversed();
            this.state.next( true );
        });
    }
}