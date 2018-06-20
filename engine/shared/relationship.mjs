export class Relationship {
    constructor( source, target, type ) {
        this.type = type;
        this.source = source;
        this.target = target;
    }

    setReversed( reversed ) {
        this.reversed = reversed;
    }
}