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
            this.createIntervalInNetwork( newCycle.id, cycle.id );
        }

        this.cycles[ name ] = newCycle;
        return newCycle;
    }
    addRelation( toAdd ) {
        let normal = toAdd.normal;
        let reversed = toAdd.reversed;
        let networkNode = this.network[ normal.source.id + '-' + normal.target.id ];
        let reversedNetworkNode = this.network[ normal.target.id + '-' + normal.source.id ];
    
        networkNode.add(normal.type.value);
        reversedNetworkNode.add(reversed.type.value);
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
        // avaliar se colocamos com ALL quando for vazio o relacionamento
        let allUnitedRelations = new Set();
        for ( let typeOne of relationsOne ) {
            for ( let typeTwo of relationsTwo) {
                let values = this.relationType.table[ typeOne ][ typeTwo -1];
                if ( values.length === 13 ) {
                    return values;
                }
                allUnitedRelations = new Set([ ...allUnitedRelations, ...values ]);
            }
        }
        return allUnitedRelations;
    }
    createIntervalInNetwork( source, target ) {
        this.network[ source + '-' + target ] = new Set();
        this.network[ target + '-' + source ] = new Set();
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
        return new Set([ ...relationsOne ].filter( (relation) => {
            return relationsTwo.has( relation )
        }));
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
                // console.log( this.network )
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
        if ( networkOne.size !== 13 && !networkTwo.size !== 13) {
            return this.betweenRelationship(networkOne, networkTwo);
        } else {
            return new Set(this.relationType.table['all'][0]);
        }
    }
    updateNetwork( add ) {
        const batchStack = [];
        let key = add.normal.source.id + '-' + add.normal.target.id;
        batchStack.push( key );

        while( batchStack.length > 0 ) {
            key = batchStack.splice(0, 1)[0];
            let i = key.split('-')[1];
            let j = key.split('-')[0];
            for ( let k = 0; k < this.network.size; k++) {
                if ( k != j && k != i ) {
                    let networkKAndJ = this.network[ k + '-' + j ];
                    let networkJAndK = this.network[ j + '-' + k ];
                    let networkIAndK = this.network[ i + '-' + k ];
                    let networkKAndI = this.network[ k + '-' + i ]; // maybe this is the reversed relation right ? If is, we only need to get the reversed in the network.
                    let networkIAndJ = this.network[ key ];
                    
                    let unitedRelationsKAndj = this.unionRelationship( networkKAndI, networkIAndJ );
                    let newRelationsKAndJ = this.intersectRelationship( networkKAndJ, unitedRelationsKAndj);
                    let unitedRelationsIAndK = this.unionRelationship( networkIAndJ, networkJAndK );
                    let newRelationsIAndK = this.intersectRelationship( networkIAndK, unitedRelationsIAndK );

                    if ( newRelationsIAndK.size === 0 || newRelationsKAndJ.size === 0 ) {
                        return false;
                    }
                
                    // maybe we need to make a intersection beetween of newRelationsKAndJ and networkKAndJ
                    // that should be equal newRelationsKAndJ
                    // besides that, maybe we need to comapre the keys and not the full object
                    if ( newRelationsKAndJ != networkKAndJ ) {
                        // need to validate if have the batch stack of the key to not push again
                        batchStack.push( k + '-' + j )
                        batchStack.push( j + '-' + k )
                        this.network[ k + '-' + j ] = newRelationsKAndJ;
                        // need to update the reverse to
                    }
                    // the some
                    if ( newRelationsIAndK !=  networkIAndK ) {
                        batchStack.push( i + '-' + k )
                        batchStack.push( k + '-' + i )
                        this.network[ i + '-' + k ] = newRelationsIAndK;
                    }
                }
            }
        }
        return true;
    }
}

