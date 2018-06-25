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
        this.cycles = {};
        this.relations = new Set();
    }
    addCycle( name ) {
        if ( this.cycles[name]) {
            return this.cycles[ name ];
        }

        let newCycle = new Cycle( name );
        let cyclesKeys = Object.keys(this.cycles)
        for ( let cycleKey of cyclesKeys ) {
            let cycle = this.cycles[ cycleKey ];
            const toAdd = this.createRelation( newCycle, cycle, this.relationType.types[ 'all' ] );
            this.addRelation( toAdd );
        }

        this.cycles[ name ] = newCycle;
        return newCycle;
    }
    addRelation( toAdd ) {
        let normal = toAdd.normal;
        let reversed = toAdd.reversed;
        let networkNode = this.network[ normal.source.id + '-' + normal.target.id ];

        if ( !networkNode ) {
            this.relations.add( normal );
            this.relations.add( reversed );
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
                let values = this.relationType.table[ typeOne ][ typeTwo -1];
                if ( values[0] === 'all' ) {
                    return this.relationType.table['all'];
                }
                allUnitedRelations = new Set([ ...allUnitedRelations, ...values ]);
            }
        }
        return allUnitedRelations;
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
    createRelation(source, target, relationType) {
        const relationNormal = new Relationship( source, target, relationType );
        const relationReversed = new Relationship( target, source, relationType.reversed );

        source.addRelation( relationNormal );
        target.addRelation( relationReversed );

        return { normal: relationNormal, reversed: relationReversed};
    }
    findCycleByName( name ) {
        return this.cycles[ name ];
    }
    initialize() {
        this.relations.clear();
        this.cycles = {};
        this.network = {};
        Cycle.resetId();
    }
    intersectRelationship( relationsOne, relationsTwo ) {
        if ( relationsTwo.has( 'all' ) ) {
            return relationsOne;
        }
        return new Set([ relationsOne ].filter( relation => relationsTwo.has( relation )));
    }
    test( graphToCreate ) {
        for ( let node  of graphToCreate ) {
            const cycle = this.addCycle(node[0]);
            let relationType = node[1].trim();
            if ( relationType && relationType != '' ) {
                if ( node[2] && node[2] != '' ) {
                    let target = node[2].replace('\r', '');
                    let targetCycle = this.findCycleByName( target );
                    
                    if ( !targetCycle ) {
                        throw 'Your graph file is inconsistent.. your relation cannot be created';
                    }

                    const relation = this.relationType.types[ this.relationType.typesName[relationType]];
                    const relations = this.createRelation( cycle, targetCycle, relation );
                    this.addRelation( relations );
                    let consistent = this.updateNetwork( relations );
                    if ( consistent ) {
                        console.log('consistent')
                    } else {
                        console.log('not consistent');
                    }
                } else {
                    console.log(node)
                    throw 'You cannot create a relation without a target node.';
                }
            }
        }
    }
    run( graphToCreate ) {
        if ( this.relationType.state.getValue() ) {
            this.initialize();
            return this.test( graphToCreate );
        } else {
            this.relationType.state.subscribe(( state ) => {
                if ( state ) {
                    this.initialize();
                    return this.test( graphToCreate );
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

