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
        this.relations = [];
        this.cycles = [];
        this.relationType = new RelationshipTypes();
        this.network = {};
    }
    addCycle( name ) {
        const cycle = new Cycle( name );
        this.cycles.push( cycle );
        return cycle;
    }
    addRelation( toAdd ) {
        for ( let relation of this.relations ) {
            if ( isRelationEqualsToAdd( toAdd.normal, relation ) || isRelationEqualsToAdd( toAdd.reversed, relation )) {
                return false;
            }
        }
        this.relations.push( toAdd.normal );
        this.relations.push( toAdd.reversed );

        this.addToTheNetwork( toAdd );
        this.resetNetwork();
        this.updateNetwork();
    }

    addToTheNetwork( toAdd ) {
        let i = toAdd.normal.source.id;
        let j = toAdd.normal.target.id;
        this.network[ i + '-' + j ] = { relation: toAdd.normal, processed: false };
        this.network[ j + '-' + i ] = { relation: toAdd.reversed, processed: false, source: this.network[ i + '-' + j ]};
    }

    // From Allen, constraint.
    createRelation(source, target, relationType) {
        const relationNormal = new Relationship( source, target, relationType );
        const relationReversed = new Relationship( target, source, relationType.reversed );

        source.addRelation( relationNormal );
        target.addRelation( relationReversed );

        return { normal: relationNormal, reversed: relationReversed};
    }

    isRelationEqualsToAdd( toAdd, relation ) {
        return toAdd.source.id === relation.source.id && toAdd.target.id === relation.target.id
    }

    readCycles() {
        const cycleA = this.addCycle('a');
        const cycleB = this.addCycle('b');
        
        const relationDuring = this.relationType.types['during'];

        const relations = this.createRelation( cycleA, cycleB, relationDuring );
        this.addRelation( relations );
    }
    resetNetwork() {
        let keys = Object.keys( this.network ); 
        for ( let key of keys ) {   
            this.network[ key ].processed = false;
        }
    }
    run() {
        this.readCycles();
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
            let j = key.split('-')[0];
            for ( let k = 0; k < this.relations.length; k++) {
                let networkKAndJ = this.network[ k + '-' + j ];
                let networkKAndI = this.network[ k + '-' + i ];
                let networkIAndJ = this.network[ i + '-' + j ];

                //let relationEvaluation = this.
            }
        }
    }
}