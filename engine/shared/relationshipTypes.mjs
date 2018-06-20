export class RelationshipTypes {
    constructor() {
        this.types = {};
        this.types[ 'finishedby' ] = { value: '-1', reversed: 'finishes' };
        this.types[ 'metby' ] = { value: '-2', reversed: 'meets' };
        this.types[ 'overlappedby' ] = { value: '-3', reversed: 'overlap' };
        this.types[ 'startedby' ] = { value: '-4', reversed: 'starts' };

        this.types[ 'equal' ] = { value: '0' };
        
        this.types[ 'after' ] = { value: '1', reversed: 'before' }
        this.types[ 'before' ] = { value: '2', reversed: 'after' }
        this.types[ 'during' ] = { value: '3' }
        this.types[ 'finishes' ] = { value: '4', reversed: 'finishedby' };
        this.types[ 'meets' ] = { value: '5', reversed: 'metby' };
        this.types[ 'overlap' ] = { value: '6', reversed: 'overlappedby' };
        this.types[ 'starts' ] = { value: '6', reversed: 'startedby' };
        
        
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
}