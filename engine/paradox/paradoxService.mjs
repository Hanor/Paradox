import { Relationship } from '../shared/relationship.mjs';
import { RelationshipTypes } from '../shared/relationshipTypes.mjs';
import { Cycle } from '../shared/cycle.mjs'

/*
 *
 * Todo change this mechanism to work with keys for better validations and less complexity
 *  
 */

export class ParadoxService {
    constructor() {
        this.relationType = new RelationshipTypes();
        this.relationType.state.subscribe(( ready ) => {
            this.state = ready;
        })
    }
    addCycle( name ) {
        const newCycle = new Cycle( name );

        for ( let cycle of this.cycles ) {
            const toAdd = this.createRelation( newCycle, cycle, this.relationType.types[ 'all' ] );
            this.addRelation( toAdd );
        }
        
        /**
         *  We need to validate this... why need to create a recursive path...
         */
        // const toAdd = this.createRelation( newCycle, newCycle, this.relationType.types[ this.relationType.typesName.equals ] );
        // this.addRelation( toAdd );

        this.cycles.push( newCycle );
        return newCycle;
    }
    addRelation( toAdd ) {
        let normal = toAdd.normal;
        let reversed = toAdd.reversed;
        let networkNode = this.network[ normal.source.id + '-' + normal.target.id ];

        if ( !networkNode ) {
            this.relations.push( normal );
            this.relations.push( reversed );
            this.addToTheNetwork( toAdd );
        } else {
            let reversedNetworkNode = this.network[ normal.target.id + '-' + normal.source.id ];
            networkNode.relation.type = normal.type;
            reversedNetworkNode.relation.type = reversed.type;
        }
        this.resetNetwork();
    }

    addToTheNetwork( toAdd ) {
        let i = toAdd.normal.source.id;
        let j = toAdd.normal.target.id;
        this.network[ i + '-' + j ] = { relation: toAdd.normal, processed: false };
        this.network[ j + '-' + i ] = { relation: toAdd.reversed, processed: false, source: this.network[ i + '-' + j ]};
        if ( !this.network.size ) {
            this.network.size = 1;
        } else {
            this.network.size += 1;
        }
    }
    betweenRelationship( relationOne, relationTwo ) {
        if ( relationOne === 'all' || relationTwo === 'all' ) {
            return this.relationType.table[ 'all' ];
        }
        let allUnitedRelations = [];
        
        // let relationsFromOne = new Set(this.relationType.table[ relationOne ]);
        // let relationsFromTwo = new Set();
        let unitedRelations = new Set([ ...this.relationType.table[ relationOne ], ...this.relationType.table[ relationTwo ] ]);
        console.log( relationOne )
        //console.log( unitedRelations )
        // let k = new Set();
        // for ( let unitedRelation of unitedRelations ) {
        //     k = new Set([...this.relationType.table[ unitedRelation ]])
        // }
        // console.log( k )
        
        // for ( let relationFromOne of relationsFromOne ) {
        //     unitedRelations = new Set([...unitedRelations, ...new Set(this.relationType.table[ relationFromOne ])]);
        //     if ( unitedRelations.has(['all']) ) {
        //         console.log('all')
        //         return this.relationType.table[ 'all' ];
        //     }
        // }
        // for ( let relationFromTwo of relationsFromTwo ) {
        //     unitedRelations = new Set([...unitedRelations, ...new Set(this.relationType.table[ relationFromTwo ])]);
        //     if ( unitedRelations.has(['all']) ) {
        //         console.log('all')
        //         return this.relationType.table[ 'all' ];
        //     }
        // }


        // let a = new Set([ 1,2,3,4 ])
        // let b = new Set([ 1,2,3,4,6 ])
        // let union = new Set([ ...a, ...b ]);
        // console.log(union)

        // console.log("JKOKOK")
        // console.log(unitedRelations)
        return allUnitedRelations;

    }
    // From Allen, constraint.
    createRelation(source, target, relationType) {
        const relationNormal = new Relationship( source, target, relationType );
        const relationReversed = new Relationship( target, source, relationType.reversed );

        source.addRelation( relationNormal );
        target.addRelation( relationReversed );

        return { normal: relationNormal, reversed: relationReversed};
    }

    initialize() {
        this.relations = [];
        this.cycles = [];
        this.network = {};
        Cycle.resetId();
    }

    test() {
        const cycleA = this.addCycle('a');
        const cycleB = this.addCycle('b');
        const cycleC = this.addCycle('c');

        const relationDuring = this.relationType.types[ this.relationType.typesName.before ];
        const relationAfter = this.relationType.types[ this.relationType.typesName.after ];

        const relationsOne = this.createRelation( cycleA, cycleB, relationDuring );
        const relationsTwo = this.createRelation( cycleB, cycleC,  relationAfter);

        this.addRelation( relationsOne );
        this.addRelation( relationsTwo );
        this.updateNetwork();
    }
    resetNetwork() {
        let keys = Object.keys( this.network ); 
        for ( let key of keys ) {   
            if ( key !== 'size' ) {
                this.network[ key ].processed = false;
            }
        }
    }
    run() {
        while ( !this.state );
        this.initialize();
        return this.test();
    }
    updateNetwork() {
        const batchStack = [];
        
        const startRelation = this.relations[ this.relations.length - 1];
        let key = startRelation.source.id + '-' + startRelation.target.id;

        batchStack.push( key );

        this.network[ key ].processed = true;
        this.network[ key ].source.processed = true;

        let iteractions = 0;
        while( batchStack.length > 0 ) {
            iteractions++;
            key = batchStack.splice(0, 1)[0];
            this.network[ key ].processed = false;

            let i = key.split('-')[0];
            let j = key.split('-')[1];
            // when k = i or k = j with dont need to verify... need to validate with teatcher
            for ( let k = 0; k < this.network.size; k++) {
                if ( k != j && k != i ) {
                    let networkKAndJ = this.network[ k + '-' + j ]; // this relation can not exists...
                    let networkKAndI = this.network[ k + '-' + i ];
                    let networkIAndJ = this.network[ key ];
                    //console.log( networkKAndI );
                    console.log( key )
                    console.log(k)
                    let possibles = this.betweenRelationship(networkKAndI.relation.type.value, networkIAndJ.relation.type.value );
                }
            }
        }
    }
}
