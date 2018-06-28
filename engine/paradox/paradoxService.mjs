import rxjs from 'rxjs';
import { Temporal } from '../allenAlgorithm/temporal.mjs';

/*
 *
 * Todo change this mechanism to work with keys for better validations and less complexity
 *  
 */

export class ParadoxService {
    constructor() {
        this.runned = new rxjs.BehaviorSubject();
        this.temporal = new Temporal();
    }
    createGraph( graphData ) {
        for ( let node  of graphData ) {
            const cycle = this.temporal.addNode(node[0]);
            let types = (node[1]) ? node[1].trim() : null;
            if ( types && types != '' ) {
                types = types.toLowerCase();
                if ( node[2] && node[2] != '' ) {
                    let target = node[2].replace('\r', '');
                    let targetCycle = this.temporal.findNodeByName( target );
                    
                    if ( !targetCycle ) {
                        throw 'Your graph file is inconsistent.. your relation cannot be created';
                    }
                    if ( targetCycle === cycle ) {
                        throw 'Little locust, sorry but this implementation cannot have cicle in the grapth =(, like a before a.'
                    }
                    let typesR = types.split(',');
                    for ( let type of typesR ) {
                        const relation = this.temporal.relationType.types[ this.temporal.relationType.typesName[type]];
                        const relations = this.temporal.createRelation( cycle, targetCycle, relation );
                        this.temporal.addRelation( relations );
                    }
                } else {
                    console.log(node)
                    throw 'You cannot create a relation without a target node.';
                }
            }
        }
    }
    initialize() {
       this.temporal.reset();
    }
    run( graphToCreate ) {
        return rxjs.Observable.create(( observer ) => {
            if ( this.temporal.relationType.state.getValue() ) {
                try {
                    this.initialize();
                    this.createGraph( graphToCreate )
                    let init = new Date();
                    let consistent = this.temporal.execute();
                    let end = new Date();
                    let namedNetwork = this.temporal.namedNetwork();
                    observer.next({network: namedNetwork, consistent: consistent, time: end.getTime() - init.getTime()});
                } catch (ex) {
                    observer.next(ex)
                }
            } else { 
                try {
                    this.temporal.relationType.state.subscribe(( state ) => {
                        if ( state ) {
                            this.initialize();
                            this.createGraph( graphToCreate )
                            let init = new Date();
                            let consistent = this.temporal.execute();
                            let end = new Date();
                            let namedNetwork = this.temporal.namedNetwork();
                            observer.next({network: namedNetwork, consistent: consistent, time: end.getTime() - init.getTime()});
                        }
                    })
                } catch (ex) {
                    observer.next(ex)
                }
            }
        })
    }
}

