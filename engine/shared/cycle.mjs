export class Cycle {
    static getIdSequence() {
        if ( !this.id ) {
         this.id = 0;
        }
        return this.id++;
    }
    static resetId() {
        this.id = 0;
    }
       
    constructor( name ) {
        this.id = Cycle.getIdSequence();
        this.relationship = [];
        this.name = name;
    }
    
    addRelation( relationship ) {
        this.relationship.push( relationship );
    }
    getRelationship() {
        return this.relationship;
    }
    getRelationshipByCycle( id ) {
        for ( let relation of this.relationship ) {
            if ( relation.target.id === id ) {
                return relation.target;
            } else if ( relation.source.id === id ) {
                return relation.source;
            }
        }
    }
}