import { RelationshipTypes } from '../shared/relationshipTypes.mjs';
import { Relationship } from '../shared/relationship.mjs';
import { Node } from '../shared/node.mjs'

export class Temporal { 
    constructor() {
        this.relationType = new RelationshipTypes();
        this.nodes = {};
        this.nodesName = {};
        this.initialized = {}
        this.relations = new Array();
    }

    addNode( name ) {
        if ( this.nodes[name]) {
            return this.nodes[ name ];
        }

        let newNode = new Node( name );
        let nodeKeys = Object.keys(this.nodes)
        for ( let nodeKey of nodeKeys ) {
            let node = this.nodes[ nodeKey ];
            this.createIntervalInNetwork( newNode.id, node.id );
        }
        this.nodesName[ newNode.id ] = name;
        this.nodes[ name ] = newNode;
        return newNode;
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
        let allUnitedRelations = new Set();
        for ( let typeOne of relationsOne ) {
            for ( let typeTwo of relationsTwo) {
                let values = this.relationType.table[ typeOne ][ typeTwo ];
                if ( values.length === 13 ) {
                    return new Set([...values]);
                }
                allUnitedRelations = new Set([ ...allUnitedRelations, ...values ]);
            }
        }
        return allUnitedRelations;
    }
    composition( relationsOne, relationsTwo ) {
        if ( !relationsOne || !relationsTwo ) {
            return new Set([...[]]);
        }
        if ( !this.isRelationAll( relationsOne, relationsTwo ) ) {
            return this.betweenRelationship(relationsOne, relationsTwo);
        } else {
            return ( relationsOne.size === 13 ) ? relationsOne : relationsTwo;
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
    execute() {
        const stack = new Array();
        const last = this.relations[ this.relations.length - 2 ];
        console.log(last)
        let cacheStack = '';
        let key = last.source.id + '-' + last.target.id;
        cacheStack += '[' + key + ']';
        stack.push( key );
        while( stack.length > 0 ) {
            key = stack.splice(0, 1)[0];
            cacheStack = cacheStack.replace( '[' + key + ']', '' );
            let i = key.split('-')[1];
            let j = key.split('-')[0];
            for ( let k = 0; k < this.network.size; k++) {
                if ( k != j && k != i ) {
                    let kj = this.network[ k + '-' + j ];
                    let jk = this.network[ j + '-' + k ];
                    let ik = this.network[ i + '-' + k ];
                    let ki = this.network[ k + '-' + i ]; // maybe this is the reversed relation right ? If is, we only need to get the reversed in the network.
                    let ij = this.network[ key ];

                    let compositionKJ = this.composition( ki, ij );
                    let intersectionKJ = this.intersection( kj, compositionKJ);

                    let compositionIK = this.composition( ij, jk);
                    let intersectionIK = this.intersection( ik, compositionIK );

                    if ( intersectionIK.size === 0 || intersectionKJ.size === 0 ) {
                        console.log(ki)
                        console.log(ij)
                        console.log(kj)
                        console.log(this.relationType.table[10][7]);
                        console.log(compositionKJ)
                        console.log(intersectionKJ)
                        return false;
                    }
                    if ( this.isNetworkRelationshipChanged( kj, intersectionKJ )) {
                        // need to validate if have the batch stack of the key to not push again
                        let keyOne = k + '-' + j;
                        let keyTwo = j + '-' + k;
                        // updating the cache and updating the stack
                        this.updateNetworkStack( stack, cacheStack, keyOne, keyTwo );
                        this.updateNetworkRelations( intersectionKJ, keyOne, keyTwo )
                    }
                    if ( this.isNetworkRelationshipChanged( ik, intersectionIK )) {
                        let keyOne = i + '-' + k;
                        let keyTwo = k + '-' + i;
                        // updating the cache and updating the stack
                        this.updateNetworkStack( stack, cacheStack, keyOne, keyTwo );
                        this.updateNetworkRelations( intersectionIK, keyOne, keyTwo )
                    }
                }
            }
        }
        return true;
    }
    findNodeByName( name ) {
        return this.nodes[ name ];
    }
    intersection( relationsOne, relationsTwo ) {
        if ( !relationsOne || !relationsTwo ) {
            return new Set([...[]]);
        }
        return new Set([ ...relationsOne ].filter( (relation) => {
            return relationsTwo.has( relation )
        }));
    }
    isRelationAll( relationsOne, relationsTwo ) {
        return relationsOne.size === 13 || relationsTwo.size === 13;
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
    namedNetwork() {
        let namedNetwork = {};
        let keys = Object.keys( this.network );
        for ( let key of keys ) {
            if ( key !== 'size') {
                let net = this.network[key];
                let newKey = this.nodesName[ key.split('-')[0] ] + '-' + this.nodesName[ key.split('-')[1] ];
                namedNetwork[ newKey ] = []
                for ( let value of net ) {
                    namedNetwork[ newKey ].push( this.relationType.types[ value ].name );
                }
            }
        }
        return namedNetwork;
    }
    reversedRelations( relations ) {
        const reversed  = new Set([]);
        for( let relation of relations )  {
            reversed.add(this.relationType.types[ relation ].reversed.value)
        }
        return reversed;
    }
    reset() {
        this.relations.splice(0, this.relations.length - 1);
        this.nodes = {};
        this.network = {};
        this.initialized = {};
        Node.resetId();
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
