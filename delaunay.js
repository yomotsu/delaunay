/*!
 * @author yomotsu http://yomotsu.net/
 * MIT License
 */

// http://qiita.com/edo_m18/items/7b3c70ed97bac52b2203
// http://tercel-sakuragaoka.blogspot.jp/2011/06/processingdelaunay_3958.html
// http://www.travellermap.com/tmp/delaunay.js

'use strict';

// --------------------------------
// Vec2
// --------------------------------

class Vec2 {

  constructor ( x, y ) {

    this.x = x;
    this.y = y;
    return this;

  }

  clone () {

    return new Vec2( this.x, this.y );

  }

  equals ( vec2 ) {

    return ( this.x === vec2.x && this.y === vec2.y );

  }


  length () {

    return Math.sqrt( this.x * this.x + this.y * this.y );

  }

  distanceTo ( vec2 ) {

    var dx = this.x - vec2.x;
    var dy = this.y - vec2.y;

    return Math.sqrt( dx * dx + dy * dy );

  }

  normalize () {

    var scalar = this.length();
    var invScalar = 1 / scalar;

    if ( scalar === 0 ) {

      this.x = 0;
      this.y = 0;

    } else {

      this.x *= invScalar;
      this.y *= invScalar;

    }

    return this;

  }

  dot ( vec2 ) {

    return this.x * vec2.x + this.y * vec2.y;

  }

  getAngle ( vec2 ) {

    var v1 = this.clone().normalize();
    var v2 = vec2.clone().normalize();

    return Math.atan2( v1.x * v2.y - v1.y * v2.x, v1.x * v2.x + v1.y * v2.y );

    // return Math.atan2( v2.y, v2.x ) - Math.atan2( v1.y, v1.x );
    // return Math.acos( v1.dot( v2 ) );

  }

  static subVectors ( v1, v2 ) {

    return new Vec2( v1.x - v2.x, v1.y - v2.y );

  }

}



// --------------------------------
// Circle
// --------------------------------

class Circle {

  constructor ( center, r ) {

    this.center = center;
    this.r = r;
  
  }

  containsPoint ( vec2 ) {

    var distance = this.center.distanceTo( vec2 );
    return ( distance <= this.r );

  }

}



// --------------------------------
// Segment
// --------------------------------

class Segment {

  constructor ( start, end ) {

    this.start = start;
    this.end   = end;

  }

  hasPoint ( vec2 ) {

    return ( this.start.equals( vec2 ) || this.end.equals( vec2 ) );

  }

  equals ( segment ) {

    return this.start.equals( segment.start ) && this.end.equals( segment.end );

  }

  getInverse ( segment ) {

    return new Segment( this.end, this.start );

  }

}



// --------------------------------
// Triangle
// --------------------------------

class Triangle {

  constructor ( a, b, c ) {

    this.a = a;
    this.b = b;
    this.c = c;

    this.segments = [
      new Segment( a, b ),
      new Segment( b, c ),
      new Segment( c, a )
    ];

    this.circumCircle = null;

  }

  getOtherVertices ( v1, v2 ) {

    var a = this.a;
    var b = this.b;
    var c = this.c;
    var vertices = [ a, b, c ];

    if ( a.equals( v1 ) ) { vertices.splice( vertices.indexOf( a ), 1 ); }
    if ( b.equals( v1 ) ) { vertices.splice( vertices.indexOf( b ), 1 ); }
    if ( c.equals( v1 ) ) { vertices.splice( vertices.indexOf( c ), 1 ); }

    if ( !v2 ) {

      return vertices;

    }

    if ( a.equals( v2 ) ) { vertices.splice( vertices.indexOf( a ), 1 ); }
    if ( b.equals( v2 ) ) { vertices.splice( vertices.indexOf( b ), 1 ); }
    if ( c.equals( v2 ) ) { vertices.splice( vertices.indexOf( c ), 1 ); }

    return vertices;

  }

  getOtherSegments ( seg1, seg2 ) {

    var segments = [].concat( this.segments );

    for ( var i = 0, seg; seg = this.segments[ i ]; i ++ ) {

      if ( seg1.equals( seg ) || seg1.getInverse().equals( seg ) ) {

        segments.splice( segments.indexOf( seg ), 1 );

      }

      if ( seg2 && ( seg2.equals( seg ) || seg2.getInverse().equals( seg ) ) ) {

        segments.splice( segments.indexOf( seg ), 1 );

      }

    }

    return segments;

  }

  hasPoint ( vec2 ) {

    return (
      this.a.equals( vec2 ) ||
      this.b.equals( vec2 ) ||
      this.c.equals( vec2 )
    );

  }

  hasSegment ( segment ) {

    return (
      this.segments[ 0 ].equals( segment ) || this.segments[ 0 ].getInverse().equals( segment ) ||
      this.segments[ 1 ].equals( segment ) || this.segments[ 1 ].getInverse().equals( segment ) ||
      this.segments[ 2 ].equals( segment ) || this.segments[ 2 ].getInverse().equals( segment )
    )

  }

  equals ( triangle ) {

    return (
      this.hasPoint( triangle.a ) &&
      this.hasPoint( triangle.b ) &&
      this.hasPoint( triangle.c )
    );

  }

  computeCircumCircle () {

    var a = this.a;
    var b = this.b;
    var c = this.c;

    var A1 = 2 * ( b.x - a.x );
    var B1 = 2 * ( b.y - a.y );
    var C1 = a.x * a.x - b.x * b.x + a.y * a.y - b.y * b.y;
    var A2 = 2 * ( c.x - a.x );
    var B2 = 2 * ( c.y - a.y );
    var C2 = a.x * a.x - c.x * c.x + a.y * a.y - c.y * c.y;

    var x = ( B1 * C2 - B2 * C1 ) / ( A1 * B2 - A2 * B1 );
    var y = ( C1 * A2 - C2 * A1 ) / ( A1 * B2 - A2 * B1 );
    var center = new Vec2( x, y );
    var r = center.distanceTo( a );

    this.circumCircle = new Circle( center, r );

  }

  computeCentroid () {

    var x = ( this.a.x + this.b.x + this.c.x ) / 3;
    var y = ( this.a.y + this.b.y + this.c.y ) / 3;

    this.centroid = new Vec2( x, y );

  }

}



// --------------------------------
// Polygon
// --------------------------------

class Polygon {

  constructor ( points ) {

    this.points = points || [];
    this.centroid = null;

  }

  computeCentroid () {

    var numOfPoints = this.points.length;
    var x = 0;
    var y = 0;

    this.points.forEach( function ( p ) {

      x += p.x;
      y += p.y;

    } );

    x /= numOfPoints;
    y /= numOfPoints;

    this.centroid = new Vec2( x, y );

    return this;

  }

  getPointsAsArray () {

    var array = [];

    this.points.forEach( function ( p ) {

      array.push( p.x, p.y );

    } );

    return array;

  }

  sortPointsClockwise () {

    if ( !this.centroid ) {

      this.computeCentroid();

    }

    var that = this;
    var axisX = new Vec2( 1, 0 );

    this.points.sort( function ( v1, v2 ) {

      var v1 = Vec2.subVectors( v1, that.centroid );
      var v2 = Vec2.subVectors( v2, that.centroid );

      return axisX.getAngle( v1 ) - axisX.getAngle( v2 );

    } );

    return this;

  }

}

// --------------------------------
// BoundingRect
// --------------------------------

class BoundingRect {

  constructor ( min, max ) {

    this.min = min;
    this.max = max;
    this.circumCircle = null;
    this.outerTriangle = null;

  }

  getWidth () {

    return this.max.x - this.min.x;

  }

  getHeight () {

    return this.max.y - this.min.y;

  }

  computeCircumCircle () {

    var center = new Vec2( this.getWidth() * 0.5, this.getHeight() * 0.5 );
    var r = center.distanceTo( this.min );
    this.circumCircle = new Circle( center, r );

  }

  computeOuterTriangle () {

    if ( !this.circumCircle ) {

      this.computeCircumCircle();

    }

    var cx = this.circumCircle.center.x;
    var cy = this.circumCircle.center.y;
    var r  = this.circumCircle.r;
    var root3R = Math.sqrt( 3 ) * this.circumCircle.r;

    var x1 = cx - root3R;
    var y1 = cy - r;
    var x2 = cx + root3R;
    var y2 = cy - r;
    var x3 = cx;
    var y3 = cy + 2 * r;

    var a = new Vec2( x1, y1 );
    var b = new Vec2( x2, y2 );
    var c = new Vec2( x3, y3 );

    this.outerTriangle = new Triangle( a, b, c );

  }

}



// --------------------------------
// DelaunayTriangles
// --------------------------------

class DelaunayTriangles {

  constructor () {

    this.bbox = null;
    this.vertices  = [];
    this.triangles = [];
    return this;

  }


  sortVerteces () {

    this.vertices.sort( function ( v1, v2 ) {

      return v1.x - v2.x;

    } );

  }


  triangulate ( vertices, bbox ) {

    var triangles = [];

    this.vertices = vertices;
    this.sortVerteces();

    bbox.computeOuterTriangle();
    triangles.push( bbox.outerTriangle );


    //---
    vertices.forEach( function ( vertex ) {

      var illegalTriangles = [];
      var illegalSegments  = [];

      triangles.forEach( function ( t ) {

        if ( !t.circumCircle ) {

          t.computeCircumCircle();

        }

        if ( t.circumCircle.containsPoint( vertex ) ) {

          illegalTriangles.push( t );

        }

      } );

      //---
      illegalTriangles.forEach( function ( illegalTriangle ) {

        illegalSegments.push(
          illegalTriangle.segments[ 0 ],
          illegalTriangle.segments[ 1 ],
          illegalTriangle.segments[ 2 ]
        );

        triangles.splice( triangles.indexOf( illegalTriangle ), 1 );

        var a = illegalTriangle.a;
        var b = illegalTriangle.b;
        var c = illegalTriangle.c;

        var newTriangle1 = new Triangle( a, b, vertex );
        var newTriangle2 = new Triangle( b, c, vertex );
        var newTriangle3 = new Triangle( c, a, vertex );

        triangles.push( newTriangle1 );
        triangles.push( newTriangle2 );
        triangles.push( newTriangle3 );

      } );

      illegalSegments = DelaunayTriangles.uniqueEdges( illegalSegments );

      illegalSegments.forEach( function ( seg ) {

        var segSharedNeighborTris = [];

        triangles.forEach( function ( t ) {

          if ( t.hasSegment( seg ) ) {

            segSharedNeighborTris.push( t );

          }

        } );

        if ( segSharedNeighborTris.length <= 1 ) {

          return;

        }

        var triangleABC = segSharedNeighborTris[ 0 ];
        var triangleABD = segSharedNeighborTris[ 1 ];

        if ( triangleABC.equals( triangleABD ) ) {

          triangles.splice( triangles.indexOf( triangleABC ), 1 );
          triangles.splice( triangles.indexOf( triangleABD ), 1 );
          return;

        }

      } );

    } );

    //---

    [ 'a', 'b', 'c' ].forEach( function ( v ) {

      for ( var i = triangles.length - 1, t; t = triangles[ i ]; i -- ) {

        if ( t.hasPoint( bbox.outerTriangle[ v ] ) ) {

          triangles.splice( i, 1 );

        }

      }

    } );

    this.triangles = triangles;
    return this;

  }


  getVolonoiPolygons () {

    var that = this;
    var polygons = [];

    var triangles = [].concat( this.triangles );
    // triangles.push( bbox.outerTriangle );

    this.vertices.forEach( function ( vertex ) {

      var polygon = new Polygon;

      triangles.forEach( function ( t ) {

        if ( t.hasPoint( vertex ) ) {

          if ( !t.centroid ) { t.computeCentroid(); }

          polygon.points.push( t.centroid );

        }

      } );


      polygon.sortPointsClockwise();


      polygons.push( polygon );

    } );

    return polygons;

  }


  static uniqueEdges ( edges ) {

    var result = [];

    edges.forEach( function ( edge1 ) {
      
      var unique = !result.some( function ( edge2 ) {

        return edge1.equals( edge2 ) || edge1.getInverse().equals( edge2 );

      } );

      if ( unique ) {

        result.push( edge1 );

      }

    } );

    return result;
   
  }

}
