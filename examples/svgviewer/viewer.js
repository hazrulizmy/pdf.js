'use strict';

// Parse query string to extract some parameters (it can fail for some input)
var query = document.location.href.replace(/^[^?]*(\?([^#]*))?(#.*)?/, '$2');
var queryParams = query ? JSON.parse('{' + query.split('&').map(function (a) {
  return a.split('=').map(decodeURIComponent).map(JSON.stringify).join(': ');
}).join(',') + '}') : {};

var url = queryParams.file || '../../test/pdfs/liveprogramming.pdf';
var scale = +queryParams.scale || 1.5;

function renderDocument(pdf, svgLib) {
  var numPages = pdf.numPages;
  // Using promise to fetch the page

  // For testing only.
  var MAX_NUM_PAGES = 50;
  var ii = Math.min(MAX_NUM_PAGES, numPages);

  var promise = Promise.resolve();
  for (var i = 1; i <= ii; i++) {
    var anchor = document.createElement('a');
    anchor.setAttribute('name', 'page=' + i);
    anchor.setAttribute('title', 'Page ' + i);
    document.body.appendChild(anchor);

    // Using promise to fetch and render the next page
    promise = promise.then(function (pageNum, anchor) {
      return pdf.getPage(pageNum).then(function (page) {
        var viewport = page.getViewport(scale);

        var container = document.createElement('div');
        container.id = 'pageContainer' + pageNum;
        container.className = 'pageContainer';
        container.style.width = viewport.width + 'px';
        container.style.height = viewport.height + 'px';
        anchor.appendChild(container);

        return page.getOperatorList().then(function (opList) {
          var svgGfx = new svgLib.SVGGraphics(page.commonObjs, page.objs);
          return svgGfx.getSVG(opList, viewport).then(function (svg) {
            container.appendChild(svg);
          });
        });
      });
    }.bind(null, i, anchor));
  }
}

// In production, the bundled pdf.js shall be used instead of RequireJS.
require.config({paths: {'pdfjs': '../../src'}});
require(['pdfjs/display/api', 'pdfjs/display/svg', 'pdfjs/display/global'],
    function (api, svg, global) {
  // In production, change this to point to the built `pdf.worker.js` file.
  global.PDFJS.workerSrc = '../../src/worker_loader.js';

  // In production, change this to point to where the cMaps are placed.
  global.PDFJS.cMapUrl = '../../external/bcmaps/';
  global.PDFJS.cMapPacked = true;

  // Fetch the PDF document from the URL using promises.
  api.getDocument(url).then(function (doc) {
    renderDocument(doc, svg);
  });
});
