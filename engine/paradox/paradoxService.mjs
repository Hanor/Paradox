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
            this.createIntervalInNetwork( toAdd );
        } else {
            let reversedNetworkNode = this.network[ normal.target.id + '-' + normal.source.id ];
            if ( networkNode.has('all')) {
                
                networkNode.add( normal.type.value );
                reversedNetworkNode.add( reversed.type.value );

                networkNode.delete('all');
                reversedNetworkNode.delete('all');
            } else {
                networkNode.add(normal.type.value);
                reversedNetworkNode.add(reversed.type.value);
            }
        }
    }

    createIntervalInNetwork( toAdd ) {
        let i = toAdd.normal.source.id;
        let j = toAdd.normal.target.id;
        this.network[ i + '-' + j ] = new Set([ toAdd.normal.type.value ]);
        this.network[ j + '-' + i ] = new Set([ toAdd.reversed.type.value ]);
        if ( !this.network.size ) {
            this.network.size = 1;
        } else {
            this.network.size += 1;
        }
    }
    betweenRelationship( relationsOne, relationsTwo ) {   
        /* 
            constraints (R1, R2 )
                C~--e;
                For each rl in R1
                    For each r2 in R2
                        C ~ C U T(rl, r2);
                Return C;
        */
        let allUnitedRelations = [];
        for ( let typeOne of relationsOne ) {
            for ( let typeTwo of relationsTwo) {
                let valuesOne = this.relationType.table[ typeOne ][ typeTwo ];
                let valuesTwo = this.relationType.table[ 2 ][ 2 ];
                if ( valuesOne[0] === 'all' || valuesTwo[0] === 'all') {
                    return this.relationType.table['all'];
                }
                allUnitedRelations = new Set([ ...valuesOne, ...valuesTwo ]);
            }
        }
        return allUnitedRelations;
    }
    
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

    intersectRelationship( relationsOne, relationsTwo ) {
        if ( relationsTwo.has( 'all' ) ) {
            return relationsOne;
        }
        return new Set([ relationsOne ].filter( relation => relationsTwo.has( relation )));
    }

    test() {
        const cycleA = this.addCycle('a');
        const cycleB = this.addCycle('b');
        const cycleC = this.addCycle('c');

        const relationBefore = this.relationType.types[ this.relationType.typesName.before ];
        const relationDuring = this.relationType.types[ this.relationType.typesName.during ];

        const relationsOne = this.createRelation( cycleA, cycleB, relationBefore );
        const relationsTwo = this.createRelation( cycleA, cycleC,  relationDuring);

        this.addRelation( relationsOne );
        let consistent = this.updateNetwork( relationsOne );
        console.log("First:")
        console.log( consistent )

        this.addRelation( relationsTwo );
        consistent = this.updateNetwork( relationsTwo );

        console.log("Second:")
        console.log( consistent )
    }
    run() {
        if ( this.relationType.state.getValue() ) {
            this.initialize();
            return this.test();
        } else {
            this.relationType.state.subscribe(( state ) => {
                if ( state ) {
                    this.initialize();
                    return this.test();
                }
            })
        }
        
    }
    unionRelationship( networkOne, networkTwo ) {
        if ( !networkOne.has( 'all' ) && !networkTwo.has( 'all' )) {
            return this.betweenRelationship(networkOne, networkTwo);
        } else {
            return new Set([...this.relationType.table['all']]);
        }
    }
    updateNetwork( add ) {
        const batchStack = [];
        let key = add.normal.source.id + '-' + add.normal.target.id;
        batchStack.push( key );

        // add.processed = true;
        // add.source.processed = true;

        while( batchStack.length > 0 ) {
            key = batchStack.splice(0, 1)[0];
            let i = key.split('-')[0];
            let j = key.split('-')[1];
            for ( let k = 0; k < this.network.size; k++) {
                if ( k != j && k != i ) {
                    let networkKAndJ = this.network[ k + '-' + j ];
                    let networkIAndK = this.network[ i + '-' + k ];
                    let networkKAndI = this.network[ k + '-' + i ]; // maybe this is the reversed relation right ? If is, we only need to get the reversed in the network.
                    let networkIAndJ = this.network[ key ];
                    let unitedRelationsIAndK = this.unionRelationship( networkIAndJ, networkIAndK );
                    let unitedRelationsKAndj = this.unionRelationship( networkKAndI, networkIAndJ );

                    // console.log( unitedRelationsIAndK )
                    // console.log(networkIAndK)
                    // console.log( unitedRelationsKAndj )
                    // console.log(networkKAndJ)

                    let newRelationsIAndK = this.intersectRelationship( unitedRelationsIAndK, networkIAndK);
                    let newRelationsKAndJ = this.intersectRelationship( unitedRelationsKAndj, networkKAndJ);
                    if ( newRelationsIAndK.size === 0 || newRelationsKAndJ.size === 0 ) {
                        return false;
                    }
                    if ( newRelationsIAndK != networkIAndK) {
                        batchStack.push(i + '-' + k);
                        this.network[ i + '-' + k ] = newRelationsIAndK;
                    }
                    if ( newRelationsKAndJ  != networkKAndJ) {
                        batchStack.push(j + '-' + k);
                        this.network[ k + '-' + j ] = newRelationsKAndJ;
                    }
                }
            }
        }
        return true;
    }
}

