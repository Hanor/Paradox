export class Node {
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
        this.id = Node.getIdSequence();
        this.relationship = [];
        this.name = name;
    }
    
    addRelation( relationship ) {
        this.relationship.push( relationship );
    }
    getRelationship() {
        return this.relationship;
    }
    getRelationshipByNode( id ) {
        for ( let relation of this.relationship ) {
            if ( relation.target.id === id ) {
                return relation.target;
            } else if ( relation.source.id === id ) {
                return relation.source;
            }
        }
    }
}