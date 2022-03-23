# Rasterizer using Canvas and pure JavaScript

This rasterizer renders 3D objects by projecting 3D vertices onto the 2D image plane. It then draws the edges and vertices using Canvas Path methods.

The Painter's algorithm is used instead of a frame buffer, since this is easier to implement when drawing polygons directly to a canvas.
