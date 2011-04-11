//
// BezierUtils.as - A small collection of static utilities for use with single-segment Bezier curves
//
////////////////////////////////////////////////////////////////////////////////
// Copyright (c) 2008 The Degrafa Team : http://www.Degrafa.com/team
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// Programmed by: Jim Armstrong
//
// This software is derived from source containing the following copyright notice
//
// copyright (c) 2006-2007, Jim Armstrong.  All Rights Reserved.
//
// version 1.2 added quad. bezier refinement as experimental method
//
// This software program is supplied 'as is' without any warranty, express, implied, 
// or otherwise, including without limitation all warranties of merchantability or fitness
// for a particular purpose.  Jim Armstrong shall not be liable for any special incidental, or 
// consequential damages, including, without limitation, lost revenues, lost profits, or 
// loss of prospective economic advantage, resulting from the use or misuse of this software 
// program.
//
////////////////////////////////////////////////////////////////////////////////

define(function(){

  	var MAX_DEPTH = 64;                                 // maximum recursion depth
  	var EPSILON = 1.0 * Math.pow(2, -MAX_DEPTH-1);    // flatness tolerance
  	
  	// pre-computed z(i,j)
  	var Z_CUBIC = [1.0, 0.6, 0.3, 0.1, 0.4, 0.6, 0.6, 0.4, 0.1, 0.3, 0.6, 1.0];
  	var Z_QUAD  = [1.0, 2/3, 1/3, 1/3, 2/3, 1.0];
  	
	function Point(x,y){
		this.x = x || 0;
		this.y = y || 0;
	}
    
 /**
   * quadArc auto-interpolates a quadratic arc through three points with a quadratic Bezier given only two endpoints and a multiplier of the distance between those points.
   * 
   * @param _po:Point First endpoint (first interpolation point)
   * @param _p2:Point Second endpoint (third interpolation point)
   * @param _alpha:Number Multiplier onto the distance between P0 and P2 to determine the middle interpolation point
   * @default 0.5
   * @param _ccw:Boolean true if the rotation direction from first to last endpoint is ccw; tends to direct the curve upwards if both points are roughly level
   * @default true
   * 
   * @return AdvancedQuadraticBezier refernce to AdvancedQuadraticBezier that interpolates the generated curve.
   *
   * @since 1.1
   *
   */  
/*
    function quadArc(_p0, _p2, _alpha, _isUpward)
    {
	_alpha = _alpha || 0.5;
	_isUpward = _isUpward || true;
      var alpha                   = Math.abs(_alpha);
      var bezier = new AdvancedQuadraticBezier();
      
      if( _p0 && _p2 )
      {
        var firstx = _p0.x;
        var firsty = _p0.y;
        var lastx  = _p2.x;
        var lasty  = _p2.y;
        var deltax = lastx - firstx;
        var deltay = lasty - firsty;
        var dist   = Math.sqrt(deltax*deltax + deltay*deltay);
        
        var midpointx = 0.5*(firstx + lastx);
        var midpointy = 0.5*(firsty + lasty);
        
        var dx = lastx - midpointx; 
        var dy = lasty - midpointy;
        
        // R is the rotated vector
        if( _isUpward )
        {
          var rx = midpointx + dy;
          var ry = midpointy - dx;
        }
        else
        {
          rx = midpointx - dy;
          ry = midpointy + dx;
        }
        
        deltax        = rx - midpointx;
        deltay        = ry - midpointy;
        var d  = Math.sqrt(deltax*deltax + deltay*deltay);
        var ux = deltax / d;
        var uy = deltay / d;
        
        var p1x = midpointx + _alpha*dist*ux;
        var p1y = midpointy + _alpha*dist*uy;
        
        bezier.interpolate( [_p0, new Point(p1x,p1y), _p2] );
      }
      
      return bezier;
    }
*/
    
/**
 * Given control and anchor points for a quad Bezier and an x-coordinate between the initial and terminal control points, return the t-parameter(s) at the input x-coordinate
 * or -1 if no such parameter exists.
**/

    function tAtX(x0, y0, cx, cy, x1, y1, x)
    {
      // quad. bezier coefficients
      var c0X = x0;
      var c1X = 2.0*(cx-x0);
      var c2X = x0-2.0*cx+x1;

      var c = c0X - x;
      var b = c1X;
      var a = c2X;
      
      var d = b*b - 4*a*c;
      if( d < 0 )
      {
        return {t1:-1, t2:-1};
      }
      
      if( Math.abs(a) < 0.00000001 )
      {
        if( Math.abs(b) < 0.00000001 )
        {
          return {t1:-1, t2:-1};
        }
        else
        {
          return{t1:-c/b, t1:-1};
        }
      }
      
      d             = Math.sqrt(d);
      a             = 1/(a + a);
      var t0 = (d-b)*a;
      var t1 = (-b-d)*a;
      
      var result = {t1:-1, t2:-1};
      if( t0 >= 0 && t0 <= 1 )
        result["t1"] = t0;
        
      if( t1 >= 0 && t1 <=1 )
      {
        if( t0 <= 0 && t0 <= 1 )
          result["t2"] = t1;
        else
          result["t1"] = t1;
      }
        
      return result;
    }

	function pointAt(seg,_t){

			var t = _t < 0 ? 0 : _t;
			t = t > 1 ? 1 : t;

			if(seg.x2 !== undefined){
							var _c0X = seg.x0;
							var _c0Y = seg.y0;

							var dX = 3.0 * (seg.x1 - seg.x0);
							var dY = 3.0 * (seg.y1 - seg.y0);
							var _c1X = dX;
							var _c1Y = dY;

							var bX = 3.0 * (seg.x2 - seg.x1) - dX;
							var bY = 3.0 * (seg.y2 - seg.y1) - dY;
							var _c2X = bX;
							var _c2Y = bY;

							var _c3X = seg.x - seg.x0 - dX - bX;
							var _c3Y = seg.y - seg.y0 - dY - bY;

							return new Point(_c0X + t * (_c1X + t * (_c2X + t * _c3X)), _c0Y + t * (_c1Y + t * (_c2Y + t * _c3Y)));
			}else{
							_c0X = seg.x0;
							_c0Y = seg.y0;

							_c1X = 2.0*(seg.x1-seg.x0);
							_c1Y = 2.0*(seg.y1-seg.y0);

							_c2X = seg.x0-2.0*seg.x1+seg.x;
							_c2Y = seg.y0-2.0*seg.y1+seg.y;
				
							return new Point( _c0X + t*(_c1X + t*(_c2X)), _c0Y + t*(_c1Y + t*(_c2Y)) );
			}
	}
    
/**
* closestPointToBezier Find the closest point on a quadratic or cubic Bezier curve to an arbitrary point
*
* @param _curve reference that must be a quadratic or cubic Bezier3
* @param _p:Point reference to <code>Point</code> to which the closest point on the Bezier curve is desired
*
* @return Number t-parameter of the closest point on the parametric curve.  Returns 0 if inputs are <code>null</code> or not a valid reference to a Bezier curve.
*
* This code is derived from the Graphic Gem, "Solving the Nearest-Point-On-Curve Problem", by P.J. Schneider, published in 'Graphic Gems', 
* A.S. Glassner, ed., Academic Press, Boston, 1990, pp. 607-611.
*
* @since 1.0
*
*/
    function closestPointToBezier( _seg, _p )
    {
      // Note - until issue is resolved with pointAt() for cubic Beziers, you should always used AdvancedCubicBezier for closest point to a cubic
      // Bezier when you need to visually identify the point in an application.
      if( _seg === null || _p === null )
      {
      	return 0;
      }
      
      // tbd - dispatch a warning event in this instance
	/*
      if( !(_seg instanceof QuadraticBezier) && !(_seg instanceof CubicBezier) )
      {
      	return 0;
      }
	*/
      
			var pMinimum,dMinimum,tMinimum;

      // record distances from point to endpoints
      var p0       = pointAt(_seg,0);
      var deltaX = p0.x-_p.x;
      var deltaY = p0.y-_p.y;
      var d0     = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
      
      var p1             = pointAt(_seg,1);
      deltaX        = p1.x-_p.x;
      deltaY        = p1.y-_p.y;
      var d1 = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
      
      var n = (_seg.x2 !== undefined) ? 3 : 2;  // degree of input Bezier curve
      
      // array of control points
      var v = new Array();
      if( n === 2 )
      {
        var quad = _seg;
        v[0]                     = new Point(quad.x0, quad.y0);
        v[1]                     = new Point(quad.x1, quad.y1);
        v[2]                     = new Point(quad.x, quad.y);
      }
      else
      {
        var cubic = _seg;
        v[0]                  = new Point(cubic.x0 , cubic.y0 );
        v[1]                  = new Point(cubic.x1 , cubic.y1 );
        v[2]                  = new Point(cubic.x2, cubic.y2);
        v[3]                  = new Point(cubic.x , cubic.y );
      }
      
      // instaead of power form, convert the function whose zeros are required to Bezier form
      var w = toBezierForm(_p, v);
      
      // Find roots of the Bezier curve with control points stored in 'w' (algorithm is recursive, this is root depth of 0)
      var roots = findRoots(w, 2*n-1, 0);
      
      // compare the candidate distances to the endpoints and declare a winner :)
      if( d0 < d1 )
      {
      	tMinimum = 0;
				pMinimum = p0;
      	dMinimum = d0;
      }
      else
      {
      	tMinimum = 1;
				pMinimum = p1;
      	dMinimum = d1;
      }
	 
      // tbd - compare 2-norm squared
      for( var i=0; i<roots.length; ++i )
      {
      	 var t = roots[i];
      	 if( t >= 0 && t <= 1 )
      	 {
      	   var p            = pointAt(_seg,t);
      	   deltaX       = p.x - _p.x;
      	   deltaY       = p.y - _p.y;
      	   var d = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
      	  
      	   if( d < dMinimum )
      	   {
      	     tMinimum = t;
      	     pMinimum = p;
      	     dMinimum = d;
      	   }
      	 }
      }
      
      // tbd - alternate optima.
      return {tMinimum:tMinimum,dMinimum:dMinimum,pMinimum:pMinimum};
    } 
    
    // compute control points of the polynomial resulting from the inner product of B(t)-P and B'(t), constructing the result as a Bezier
    // curve of order 2n-1, where n is the degree of B(t).
    function toBezierForm(_p, _v)
    {
      var row    = 0;  // row index
      var column = 0;	// column index
      
      var c = new Array();  // V(i) - P
      var d = new Array();  // V(i+1) - V(i)
      var w = new Array();  // control-points for Bezier curve whose zeros represent candidates for closest point to the input parametric curve
   
      var n      = _v.length-1;    // degree of B(t)
      var degree = 2*n-1;          // degree of B(t) . P
      
      var pX = _p.x;
      var pY = _p.y;
      
      for( var i=0; i<=n; ++i )
      {
        var v = _v[i];
        c[i]        = new Point(v.x - pX, v.y - pY);
      }
      
      var s = Number(n);
      for( i=0; i<=n-1; ++i )
      {
      	v            = _v[i];
      	var v1 = _v[i+1];
      	d[i]         = new Point( s*(v1.x-v.x), s*(v1.y-v.y) );
      }
      
      var cd = new Array();
      
      // inner product table
      for( row=0; row<=n-1; ++row )
      {
      	var di  = d[row];
      	var dX = di.x;
      	var dY = di.y;
      	
      	for( var col=0; col<=n; ++col )
      	{
      	  var k = getLinearIndex(n+1, row, col);
      	  cd[k]      = dX*c[col].x + dY*c[col].y;
      	  k++;
      	}
      }
      
      // Bezier is uniform parameterized
      var dInv = 1.0/Number(degree);
      for( i=0; i<=degree; ++i )
      {
      	w[i] = new Point(Number(i)*dInv, 0);
      }
      
      // reference to appropriate pre-computed coefficients
      var z = n === 3 ? Z_CUBIC : Z_QUAD;
      
      // accumulate y-coords of the control points along the skew diagonal of the (n-1) x n matrix of c.d and z values
      var m = n-1;
      for( k=0; k<=n+m; ++k ) 
      {
        var lb = Math.max(0, k-m);
        var ub = Math.min(k, n);
        for( i=lb; i<=ub; ++i) 
        {
          var j     = k - i;
          var p    = w[i+j];
          var index = getLinearIndex(n+1, j, i);
          p.y           += cd[index]*z[index];
          w[i+j]         = p;
        }
      }
      
      return w;	
    }
    
    // convert 2D array indices in a k x n matrix to a linear index (this is an interim step ahead of a future implementation optimized for 1D array indexing)
    function getLinearIndex(_n, _row, _col)
    {
      // no range-checking; you break it ... you buy it!
      return _row*_n + _col;
    }
    
    // how many times does the Bezier curve cross the horizontal axis - the number of roots is less than or equal to this count
    function crossingCount(_v, _degree)
    {
      var nCrossings = 0;
      var sign        = _v[0].y < 0 ? -1 : 1;
      var oldSign     = sign;
      for( var i=1; i<=_degree; ++i) 
      {
        sign = _v[i].y < 0 ? -1 : 1;
        if( sign != oldSign ) 
          nCrossings++;
             
         oldSign = sign;
      }
      
      return nCrossings;
    }
    
    // is the control polygon for a Bezier curve suitably linear for subdivision to terminate?
    function isControlPolygonLinear(_v, _degree) 
    {
      // Given array of control points, _v, find the distance from each interior control point to line connecting v[0] and v[degree]
    
      // implicit equation for line connecting first and last control points
      var a = _v[0].y - _v[_degree].y;
      var b = _v[_degree].x - _v[0].x;
      var c = _v[0].x * _v[_degree].y - _v[_degree].x * _v[0].y;
    
      var abSquared = a*a + b*b;
      var distance   = new Array();       // Distances from control points to line
    
      for( var i=1; i<_degree; ++i) 
      {
        // Compute distance from each of the points to that line
        distance[i] = a * _v[i].x + b * _v[i].y + c;
        if( distance[i] > 0.0 ) 
        {
          distance[i] = (distance[i] * distance[i]) / abSquared;
        }
        if( distance[i] < 0.0 ) 
        {
          distance[i] = -((distance[i] * distance[i]) / abSquared);
        }
      }
    
      // Find the largest distance
      var maxDistanceAbove = 0.0;
      var maxDistanceBelow = 0.0;
      for( i=1; i<_degree; ++i) 
      {
        if( distance[i] < 0.0 ) 
        {
          maxDistanceBelow = Math.min(maxDistanceBelow, distance[i]);
        }
        if( distance[i] > 0.0 ) 
        {
          maxDistanceAbove = Math.max(maxDistanceAbove, distance[i]);
        }
      }
    
      // Implicit equation for zero line
      var a1 = 0.0;
      var b1 = 1.0;
      var c1 = 0.0;
    
      // Implicit equation for "above" line
      var a2 = a;
      var b2 = b;
      var c2 = c + maxDistanceAbove;
    
      var det  = a1*b2 - a2*b1;
      var dInv = 1.0/det;
        
      var intercept1 = (b1*c2 - b2*c1)*dInv;
    
      //  Implicit equation for "below" line
      a2 = a;
      b2 = b;
      c2 = c + maxDistanceBelow;
        
      var intercept2 = (b1*c2 - b2*c1)*dInv;
    
      // Compute intercepts of bounding box
      var leftIntercept  = Math.min(intercept1, intercept2);
      var rightIntercept = Math.max(intercept1, intercept2);
    
      var error = 0.5*(rightIntercept-leftIntercept);    
        
      return error < EPSILON;
    }
    
    // compute intersection of line segnet from first to last control point with horizontal axis
    function computeXIntercept(_v, _degree)
    {
      var XNM = _v[_degree].x - _v[0].x;
      var YNM = _v[_degree].y - _v[0].y;
      var XMK = _v[0].x;
      var YMK = _v[0].y;
    
      var detInv = - 1.0/YNM;
    
      return (XNM*YMK - YNM*XMK) * detInv;
    }
    
    // return roots in [0,1] of a polynomial in Bernstein-Bezier form
    function findRoots(_w, _degree, _depth)
    {  
      var t = new Array(); // t-values of roots
      var m  = 2*_degree-1;
      
      switch( crossingCount(_w, _degree) ) 
      {
        case 0: 
          return [];   
        break;
           
        case 1: 
          // Unique solution - stop recursion when the tree is deep enough (return 1 solution at midpoint)
          if( _depth >= MAX_DEPTH ) 
          {
            t[0] = 0.5*(_w[0].x + _w[m].x);
            return t;
          }
            
          if( isControlPolygonLinear(_w, _degree) ) 
          {
            t[0] = computeXIntercept(_w, _degree);
            return t;
          }
        break;
	default:
		break;
      }
 
      // Otherwise, solve recursively after subdividing control polygon
      var left  = new Array();
      var right = new Array();
       
      // child solutions
         
      subdivide(_w, 0.5, left, right);
      var leftT  = findRoots(left,  _degree, _depth+1);
      var rightT = findRoots(right, _degree, _depth+1);
     
      // Gather solutions together
      for( var i= 0; i<leftT.length; ++i) 
        t[i] = leftT[i];
       
      for( i=0; i<rightT.length; ++i) 
        t[i+leftT.length] = rightT[i];
    
      return t;
    }
    
/**
* subdivide( _c, _t, _left, _right ) - deCasteljau subdivision of an arbitrary-order Bezier curve
*
* @param _c array of control points for the Bezier curve
* @param _t t-parameter at which the curve is subdivided (must be in (0,1) = no check at this point
* @param _left reference to an array in which the control points, <code>Array</code> of <code>Point</code> references, of the left control cage after subdivision are stored
* @param _right reference to an array in which the control points, <code>Array</code> of <code>Point</code> references, of the right control cage after subdivision are stored
* @return nothing 
*
* @since 1.0
*
*/
    function subdivide( _c, _t, _left, _right )
    {
      var degree = _c.length-1;
      var n      = degree+1;
      var p     = _c.slice();
      var t1   = 1.0 - _t;
      
      for( var i=1; i<=degree; ++i ) 
      {  
        for( var j=0; j<=degree-i; ++j ) 
        {
          var vertex = new Point();
          var ij      = getLinearIndex(n, i, j);
          var im1j    = getLinearIndex(n, i-1, j);
          var im1jp1  = getLinearIndex(n, i-1, j+1);
          
          vertex.x = t1*p[im1j].x + _t*p[im1jp1].x;
          vertex.y = t1*p[im1j].y + _t*p[im1jp1].y;
          p[ij]    = vertex;
        }
      }
      
      for( j=0; j<=degree; ++j )
      {
      	 var index = getLinearIndex(n, j, 0);
        _left[j]       = p[index];
      }
        
      for( j=0; j<=degree; ++j) 
      {
      	 index     = getLinearIndex(n, degree-j, j);
        _right[j] = p[index];
      }
    }
    
/**
 * quadRefine refines a quadratic Bezier curve in the interval [t1,t2], where t1 and t2 are in (0,1), t2 > t1
 * 
 * @param _q reference to quadratic Bezier curve to be refined
 * @param _t1 left point in refinement interval
 * @param _t2 right point in refinement interval
 * 
 * @return Object x0, y0, cx, cy, x1, and y1 properties are control points of quadratic bezier curve representing the segment of the original curve in [t1,t2]
 * returns a copy of the input quadratic bezier if input interval is invalid
 *
 * @since 1.2
 *
 */  
/*
    function quadRefine(_q, _t1, _t2)
    {
      if( _t1 < 0 || _t2 > 1 || _t2 <= _t1 )
        return { x0:_q.x0, y0:_q.y0, cx:_q.cx, cy:_q.cy, x1:_q.x1, y1:_q.y1 };
      
      // four points defining two lines
      var p = _q.pointAt(_t1);
      var x1 = p.x;
      var y1 = p.y;
      var x2 = (1-_t1)*_q.cx + _t1*_q.x1;
      var y2 = (1-_t1)*_q.cy + _t1*_q.y1;
      var x3 = (1-_t2)*_q.x0 + _t2*_q.cx;
      var y3 = (1-_t2)*_q.y0 + _t2*_q.cy;
      var x4 = (1-_t2)*_q.cx + _t2*_q.x1;
      var y4 = (1-_t2)*_q.cy + _t2*_q.y1;
      
      var o = intersect(x1, y1, x2, y2, x3, y3, x4, y4);
      p            = _q.pointAt(_t2);
      
      return { x0:x1, y0:y1, cx:o.cx, cy:o.cy, x1:p.x, y1:p.y };
    }
*/
    
    function intersect(x1, y1, x2, y2, x3, y3, x4, y4)
    {
      // tbd - haven't tested every path through this code yet - please feel free to do it for me so I can get back to the mundane
      // task of making a living while you score some bucks off my free code :)
      var deltaX1 = x2-x1;
      var deltaX2 = x4-x3;
      var d1Abs   = Math.abs(deltaX1);
      var d2Abs   = Math.abs(deltaX2);
      var m1      = 0;
      var m2      = 0;
      var pX      = 0;
      var pY      = 0;
      
      if( d1Abs <= 0.000001 )
      {
        pX = x1;
        m2   = (y3 - y4)/deltaX2;
        pY = (d2Abs <= 0.000001) ? (x1 + 3*(y1-x1)) : (m2*(x1-x4)+y4);
      }
      else if( d2Abs <= 0.000001 )
      {
        pX = x4;
        m1   = (y2 - y1)/deltaX1;
        pY = (d1Abs <= 0.000001) ? (x3 + 3*(x3-x4)) : (m1*(x4-x1)+y1);
      }
      else
      {
        m1 = (y2 - y1)/deltaX1;
        m2 = (y4 - y3)/deltaX2;
        
        if( Math.abs(m1) <= 0.000001 && Math.abs(m2) <= 0.000001 )
        {
          pX = 0.5*(x1 + x4);
          pY = 0.5*(y1 + y4);
        }
        else
        {
          var b1 = y1 - m1*x1;
          var b2 = y4 - m2*x4;
          pX            = (b2-b1)/(m1-m2);
          pY            = m1*pX + b1;
        }
      }
      
      return {cx:pX, cy:pY};
    }

	return closestPointToBezier;
});
