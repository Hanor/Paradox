import { Relationship } from '../shared/relationship.mjs';
import { RelationshipTypes } from '../shared/relationshipTypes.mjs';
import { Cycle } from '../shared/cycle.mjs'
import rxjs from 'rxjs';

/*
 *
 * Todo change this mechanism to work with keys for better validations and less complexity
 *  
 */

export class ParadoxService {
    constructor() {
        this.relationType = new RelationshipTypes();
        this.cycles = {};
        this.initialized = {};
        this.relations = new Array();
        this.runned = new rxjs.BehaviorSubject();
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
        let keyOne = normal.source.id + '-' + normal.target.id;
        let keyTwo = normal.target.id + '-' + normal.source.id;
        let networkNode = this.network[ keyOne ];
        let reversedNetworkNode = this.network[ keyTwo ];

        if ( this.initialized[ keyOne ] ) {
            networkNode.add(normal.type.value);
        } else {
            networkNode.clear();
            networkNode.add(normal.type.value);
            this.initialized[ keyOne ] = true;
        }
        if ( this.initialized[ keyTwo ] ) {
            reversedNetworkNode.add(reversed.type.value);
        } else {
            reversedNetworkNode.clear();
            reversedNetworkNode.add(reversed.type.value);
            this.initialized[ keyTwo ] = true;
        }
        this.relations.push( toAdd.normal );
        this.relations.push( toAdd.reversed );
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
    createGraph( graphData ) {
        for ( let node  of graphData ) {
            const cycle = this.addCycle(node[0]);
            let relationType = (node[1]) ? node[1].trim() : null;
            if ( relationType && relationType != '' ) {
                relationType = relationType.toLowerCase();
                if ( node[2] && node[2] != '' ) {
                    let target = node[2].replace('\r', '');
                    let targetCycle = this.findCycleByName( target );
                    
                    if ( !targetCycle ) {
                        throw 'Your graph file is inconsistent.. your relation cannot be created';
                    }
                    if ( targetCycle === cycle ) {
                        throw 'Little locust, sorry but this implementation cannot have cicle in the grapth =(, like a before a.'
                    }

                    const relation = this.relationType.types[ this.relationType.typesName[relationType]];
                    const relations = this.createRelation( cycle, targetCycle, relation );
                    this.addRelation( relations );
                } else {
                    console.log(node)
                    throw 'You cannot create a relation without a target node.';
                }
            }
        }
    }
    createIntervalInNetwork( source, target ) {
        this.network[ source + '-' + target ] = new Set([ ...this.relationType.all ]);
        this.network[ target + '-' + source ] = new Set([ ...this.relationType.all ]);
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
        this.relations.splice(0, this.relations.length - 1);
        this.cycles = {};
        this.network = {};
        this.initialized = {};
        Cycle.resetId();
    }
    intersectRelationship( relationsOne, relationsTwo ) {
        if ( !relationsOne || !relationsTwo ) {
            return new Set([...[]]);
        }

        return new Set([ ...relationsOne ].filter( (relation) => {
            return relationsTwo.has( relation )
        }));
    }
    isNetworksAll( relationsOne, relationsTwo ) {
        try {
            return relationsOne.size !== 13 && relationsTwo.size !== 13
        } catch ( ex ) {
            console.log( relationsOne )
            console.log( relationsTwo )
            throw ex;
        }
        
    }
    isNetworkRelationshipChanged( relationsOne, relationsTwo ) {
        if( relationsOne.size !== relationsTwo.size ) {
            return true;
        }

        relationsOne.forEach(( element ) => {
            if ( !relationsTwo.has( element )) {
                return true;
            }
        });
        return false;
    }
    reversedRelations( relations ) {
        const reversed  = new Set([]);
        for( let relation of relations )  {
            reversed.add(this.relationType.types[ relation ].reversed.value)
        }
        return reversed;
    }
    run( graphToCreate ) {
        return rxjs.Observable.create(( observer ) => {
            if ( this.relationType.state.getValue() ) {
                this.initialize();
                this.createGraph( graphToCreate )
                let init = new Date();
                let consistent = this.updateNetwork( this.relations[0] );
                let end = new Date();
                observer.next({network: this.network, consistent: consistent, time: end.getTime() - init.getTime()});
                // return {network: this.network, consistent: consistent};
            } else {
                this.relationType.state.subscribe(( state ) => {
                    if ( state ) {
                        this.initialize();
                        this.createGraph( graphToCreate )
                        let init = new Date();
                        let consistent = this.updateNetwork( this.relations[0] );
                        let end = new Date();
                        observer.next({network: this.network, consistent: consistent, time: end.getTime() - init.getTime()});
                    }
                })
            }
        })
    }
    unionRelationship( relationsOne, relationsTwo ) {
        if ( !relationsOne || !relationsTwo ) {
            return new Set([...[]]);
        }
        if ( !this.isNetworksAll( relationsOne, relationsTwo ) ) {
            return this.betweenRelationship(relationsOne, relationsTwo);
        } else {
            return ( relationsOne.size === 13 ) ? relationsOne : relationsTwo;
        }
    }
    updateNetwork( add ) {
        const stack = new Array();
        let cacheStack = '';
        let key = add.source.id + '-' + add.target.id;
        cacheStack += '[' + key + ']';
        stack.push( key );
        while( stack.length > 0 ) {
            key = stack.splice(0, 1)[0];
            cacheStack = cacheStack.replace( '[' + key + ']', '' );
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
                    
                    if ( this.isNetworkRelationshipChanged( networkKAndJ, newRelationsKAndJ )) {
                        // need to validate if have the batch stack of the key to not push again
                        let keyOne = k + '-' + j;
                        let keyTwo = j + '-' + k;
                        // updating the cache and updating the stack
                        this.updateNetworkStack( stack, cacheStack, keyOne, keyTwo );
                        this.updateNetworkRelations( newRelationsIAndK, keyOne, keyTwo )
                    }
                    if ( this.isNetworkRelationshipChanged( networkKAndJ, newRelationsKAndJ )) {
                        let keyOne = i + '-' + k;
                        let keyTwo = k + '-' + i;
                        // updating the cache and updating the stack
                        console.log( cacheStack )
                        this.updateNetworkStack( stack, cacheStack, keyOne, keyTwo );
                        this.updateNetworkRelations( newRelationsIAndK, keyOne, keyTwo )
                    }
                }
            }
        }
        return true;
    }
    updateNetworkRelations( relationship, keyOne, keyTwo ) {
        this.network[ keyOne ] = relationship;
        this.network[ keyTwo ] = this.reversedRelations( relationship );
    }
    updateNetworkStack( stack, cacheStack, keyOne, keyTwo )  {
        if (!cacheStack.includes( keyOne ) ) {
            cacheStack += '[' + keyOne + ']';
            stack.push( keyOne )
            cacheStack += '[' + keyTwo + ']';
            stack.push( keyTwo )
        }
    }
}

