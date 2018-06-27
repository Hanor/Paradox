import { TestBed, inject } from '@angular/core/testing';

import { GraphViewerService } from './graphViewer/graphViewer.service';

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
