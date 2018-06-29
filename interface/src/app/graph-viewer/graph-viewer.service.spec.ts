import { TestBed, inject } from '@angular/core/testing';

import { GraphViewerService } from './graph-viewer/graph-viewer.service';

describe('GraphViewerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GraphViewerService]
    });
  });

  it('should be created', inject([GraphViewerService], (service: GraphViewerService) => {
    expect(service).toBeTruthy();
  }));
});
