/*
 *
 *                  xxxxxxx      xxxxxxx
 *                   x:::::x    x:::::x
 *                    x:::::x  x:::::x
 *                     x:::::xx:::::x
 *                      x::::::::::x
 *                       x::::::::x
 *                       x::::::::x
 *                      x::::::::::x
 *                     x:::::xx:::::x
 *                    x:::::x  x:::::x
 *                   x:::::x    x:::::x
 *              THE xxxxxxx      xxxxxxx TOOLKIT
 *
 *                  http://www.goXTK.com
 *
 * Copyright (c) 2012 The X Toolkit Developers <dev@goXTK.com>
 *
 *    The X Toolkit (XTK) is licensed under the MIT License:
 *      http://www.opensource.org/licenses/mit-license.php
 *
 *      "Free software" is a matter of liberty, not price.
 *      "Free" as in "free speech", not as in "free beer".
 *                                         - Richard M. Stallman
 *
 *
 * CREDITS:
 *
 *   - the endianness handling was inspired by
 *     Ilmari Heikkinen's DataStream.js (https://github.com/kig/DataStream.js)
 *     THANKS!!
 *
 */

// provides
goog.provide('X.parser');

// requires
goog.require('X.base');
goog.require('X.event');
goog.require('X.texture');
goog.require('X.triplets');


/**
 * Create a parser for binary or ascii data.
 *
 * @constructor
 * @extends X.base
 */
X.parser = function() {

  //
  // call the standard constructor of X.base
  goog.base(this);

  //
  // class attributes

  /**
   * @inheritDoc
   * @const
   */
  this._classname = 'parser';

  /**
   * The data.
   *
   * @type {?ArrayBuffer}
   * @protected
   */
  this._data = null;

  /**
   * The pointer to the current byte.
   *
   * @type {!number}
   * @protected
   */
  this._dataPointer = 0;

  /**
   * The native endianness flag. Based on
   * https://github.com/kig/DataStream.js/blob/master/DataStream.js
   *
   * @type {!boolean}
   * @protected
   */
  this._nativeLittleEndian = new Int8Array(new Int16Array([ 1 ]).buffer)[0] > 0;

  /**
   * The data-specific endianness flag.
   *
   * @type {!boolean}
   * @protected
   */
  this._littleEndian = true;

  /**
   * The min value of the last parsing attempt.
   *
   * @type {!number}
   * @protected
   */
  this._lastMin = -Infinity;

  /**
   * The max value of the last parsing attempt.
   *
   * @type {!number}
   * @protected
   */
  this._lastMax = Infinity;

};
// inherit from X.base
goog.inherits(X.parser, X.base);


/**
 * Parse data and configure the given object. When complete, a
 * X.parser.ModifiedEvent is fired.
 *
 * @param {!X.base}
 *          container A container which holds the loaded data. This can be an
 *          X.object as well.
 * @param {!X.object}
 *          object The object to configure.
 * @param {!ArrayBuffer}
 *          data The data to parse.
 * @param {*}
 *          flag An additional flag.
 * @throws {Error}
 *           An exception if something goes wrong.
 */
X.parser.prototype.parse = function(container, object, data, flag) {

  throw new Error('The function parse() should be overloaded.');

};


//
// PARSE FUNCTIONS
//
//
/**
 * Get the min and max values of an array.
 *
 * @param {!Array}
 *          data The data array to analyze.
 * @return {!Array} An array with length 2 containing the [min, max] values.
 */
X.parser.prototype.arrayMinMax = function(data) {

  var _min = Infinity;
  var _max = -Infinity;

  // buffer the length
  var _datasize = data.length;

  var i = 0;
  for (i = 0; i < _datasize; i++) {

    var _value = data[i];
    _min = Math.min(_min, _value);
    _max = Math.max(_max, _value);

  }

  return [ _min, _max ];

};


/**
 * Create a string from a bunch of UChars. This replaces a
 * String.fromCharCode.apply call and therefor supports more platforms (like the
 * Android stock browser).
 *
 * @param {!Array|Uint8Array}
 *          array The Uint8Array.
 * @param {?number=}
 *          start The start position. If undefined, use the whole array.
 * @param {?number=}
 *          end The end position. If undefined, use the whole array.
 * @return {string} The created string.
 */
X.parser.prototype.parseChars = function(array, start, end) {

  // without borders, use the whole array
  if (start === undefined) {

    start = 0;

  }
  if (end === undefined) {

    end = array.length;

  }

  var _output = '';
  // create and append the chars
  var i = 0;
  for (i = start; i < end; ++i) {

    _output += String.fromCharCode(array[i]);

  }

  return _output;

};


/**
 * Jump to a position in the byte stream.
 *
 * @param {!number}
 *          position The new offset.
 */
X.parser.prototype.jumpTo = function(position) {

  this._dataPointer = position;

};


/**
 * Scan binary data relative to the internal position in the byte stream.
 *
 * @param {!string}
 *          type The data type to scan, f.e.
 *          'uchar','schar','ushort','sshort','uint','sint','float'
 * @param {!number=}
 *          chunks The number of chunks to scan. By default, 1.
 */
X.parser.prototype.scan = function(type, chunks) {

  if (!goog.isDefAndNotNull(chunks)) {

    chunks = 1;

  }

  var _chunkSize = 1;
  var _array_type = Uint8Array;

  switch (type) {

  // 1 byte data types
  case 'uchar':
    break;
  case 'schar':
    _array_type = Int8Array;
    break;
  // 2 byte data types
  case 'ushort':
    _array_type = Uint16Array;
    _chunkSize = 2;
    break;
  case 'sshort':
    _array_type = Int16Array;
    _chunkSize = 2;
    break;
  // 4 byte data types
  case 'uint':
    _array_type = Uint32Array;
    _chunkSize = 4;
    break;
  case 'sint':
    _array_type = Int32Array;
    _chunkSize = 4;
    break;
  case 'float':
    _array_type = Float32Array;
    _chunkSize = 4;
    break;
  case 'complex':
    _array_type = Float64Array;
    _chunkSize = 8;
    break;
  case 'double':
    _array_type = Float64Array;
    _chunkSize = 8;
    break;

  }

  // increase the data pointer in-place
  var _bytes = new _array_type(this._data.slice(this._dataPointer,
      this._dataPointer += chunks * _chunkSize));

  // if required, flip the endianness of the bytes
  if (this._nativeLittleEndian != this._littleEndian) {

    // we need to flip here since the format doesn't match the native endianness
    _bytes = this.flipEndianness(_bytes, _chunkSize);

  }

  if (chunks == 1) {

    // if only one chunk was requested, just return one value
    return _bytes[0];

  }

  // return the byte array
  return _bytes;

};


/**
 * Flips typed array endianness in-place. Based on
 * https://github.com/kig/DataStream.js/blob/master/DataStream.js.
 *
 * @param {!Object}
 *          array Typed array to flip.
 * @param {!number}
 *          chunkSize The size of each element.
 * @return {!Object} The converted typed array.
 */
X.parser.prototype.flipEndianness = function(array, chunkSize) {

  var u8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  for ( var i = 0; i < array.byteLength; i += chunkSize) {

    for ( var j = i + chunkSize - 1, k = i; j > k; j--, k++) {

      var tmp = u8[k];
      u8[k] = u8[j];
      u8[j] = tmp;

    }

  }

  return array;

};


/**
 * Convert orientation to RAS
 *
 * @param {!Array}
 *          space The space we are in (RAS, LPS, etc.).
 * @param {!Array}
 *          orientation The orientation in current space.
 * @return {!Array} The RAS orienation array.
 */
X.parser.prototype.toRAS = function(space, orientation) {

  var _ras_space_orientation = orientation;

  if (space[0] != 'right') {

    _ras_space_orientation[0] = -_ras_space_orientation[0];
    _ras_space_orientation[3] = -_ras_space_orientation[3];
    _ras_space_orientation[6] = -_ras_space_orientation[6];

  }
  if (space[1] != 'anterior') {

    _ras_space_orientation[1] = -_ras_space_orientation[1];
    _ras_space_orientation[4] = -_ras_space_orientation[4];
    _ras_space_orientation[7] = -_ras_space_orientation[7];

  }
  if (space[2] != 'superior') {

    _ras_space_orientation[2] = -_ras_space_orientation[2];
    _ras_space_orientation[5] = -_ras_space_orientation[5];
    _ras_space_orientation[8] = -_ras_space_orientation[8];

  }

  return _ras_space_orientation;

};


/**
 * Get orientation on normalized cosines
 *
 * @param {!Array}
 *          rasorientation The orientation in RAS space.
 * @return {!Array} The orientation and the normalized cosines.
 */
X.parser.prototype.orientnormalize = function(rasorientation) {

  X.TIMER(this._classname + '.orientnormalize');

  var _x_cosine = rasorientation.slice(0, 3);

  var _x_abs_cosine = _x_cosine.map(function(v) {

    return Math.abs(v);

  });

  var _x_max = _x_abs_cosine.indexOf(Math.max.apply(Math, _x_abs_cosine));
  var _x_norm_cosine = [ 0, 0, 0 ];
  _x_norm_cosine[_x_max] = _x_cosine[_x_max] < 0 ? -1 : 1;
  var _y_cosine = rasorientation.slice(3, 6);
  var _y_abs_cosine = _y_cosine.map(function(v) {

    return Math.abs(v);

  });

  var _y_max = _y_abs_cosine.indexOf(Math.max.apply(Math, _y_abs_cosine));
  var _y_norm_cosine = [ 0, 0, 0 ];
  _y_norm_cosine[_y_max] = _y_cosine[_y_max] < 0 ? -1 : 1;
  var _z_cosine = rasorientation.slice(6, 9);
  var _z_abs_cosine = _z_cosine.map(function(v) {

    return Math.abs(v);

  });

  var _z_max = _z_abs_cosine.indexOf(Math.max.apply(Math, _z_abs_cosine));
  var _z_norm_cosine = [ 0, 0, 0 ];
  _z_norm_cosine[_z_max] = _z_cosine[_z_max] < 0 ? -1 : 1;
  //
  var orientation = [ _x_norm_cosine[_x_max], _y_norm_cosine[_y_max],
      _z_norm_cosine[_z_max] ];

  // might be usefull to loop
  var norm_cosine = [ _x_norm_cosine, _y_norm_cosine, _z_norm_cosine ];

  X.TIMERSTOP(this._classname + '.orientnormalize');

  return [ orientation, norm_cosine ];

};


/**
 * Reslice a data stream to fill the slices of an X.volume in X,Y and Z
 * directions. The given volume (object) has to be created at this point
 * according to the proper dimensions. This also takes care of a possible
 * associated label map which has to be loaded before.
 *
 * @param {!X.object}
 *          object The X.volume to fill.
 * @return {!Array} The volume data as a 3D Array.
 */
X.parser.prototype.reslice = function(object) {

  X.TIMER(this._classname + '.reslice');
  
 // parse file to IJK coordinates
  // labelmap and color tables
  var hasLabelMap = object._labelmap != null;
  var _colorTable = null;
  if (object._colortable) {

    _colorTable = object._colortable._map;

  }

  // allocate and fill volume
  // rows, cols and slices (ijk dimensions)
  var _dim = object._dimensions;
//  
  var datastream = object._data;
  var image = new Array(_dim[2]);
  // use real image to return real values
  var realImage = new Array(_dim[2]);
  // (fill volume)
  var _nb_pix_per_slice = _dim[1] * _dim[0];
  var _pix_value = 0;
  var _i = 0;
  var _j = 0;
  var _k = 0;
  var _data_pointer = 0;
  for (_k = 0; _k < _dim[2]; _k++) {

    // get current slice
    var _current_k = datastream.subarray(_k * (_nb_pix_per_slice), (_k + 1)
        * _nb_pix_per_slice);
    // now loop through all pixels of the current slice
    _i = 0;
    _j = 0;
    _data_pointer = 0; // just a counter
    
    image[_k] = new Array(_dim[1]);
    realImage[_k] = new Array(_dim[1]);
    for (_j = 0; _j < _dim[1]; _j++) {
    image[_k][_j] = new object._data.constructor(_dim[0]);
    realImage[_k][_j] = new object._data.constructor(_dim[0]);
    for (_i = 0; _i < _dim[0]; _i++) {

        // go through row (i) first :)
        // 1 2 3 4 5 6 ..
        // .. .... .. . .
        //
        // not
        // 1 .. ....
        // 2 ...
        // map pixel values
        _pix_value = _current_k[_data_pointer];
        image[_k][_j][_i] = 255 * (_pix_value / object._max);
        realImage[_k][_j][_i] = _pix_value;
        _data_pointer++;

      }

    }

  }
  
  
  X.TIMER(this._classname + '.RRESLICE');
  // Get middle slice RAS information
  var _rasorigin = object._RASOrigin;
  window.console.log('RAS Origin');
  window.console.log(_rasorigin);
  window.console.log('RAS Spacing');
  var _rasspacing = object._RASSpacing;
  window.console.log(_rasspacing);
  window.console.log('RAS Dimensions');
  var _rasdimensions = object._RASDimensions;
  window.console.log(_rasdimensions);
  
  var _rascenter = [_rasorigin[0] + _rasdimensions[0]/2,
                    _rasorigin[1] + _rasdimensions[1]/2,
                    _rasorigin[2] + _rasdimensions[2]/2
                    ];

//  window.console.log(object._dimensions);
    
  window.console.log('RAS Center');
  window.console.log(_rascenter);
  
  var _ras2ijk = object._RASToIJK;
  
  var tar3 = new goog.vec.Vec4.createFloat32FromValues(_rascenter[0], _rascenter[1], _rascenter[2], 1);
  var res3 = new goog.vec.Vec4.createFloat32();
  goog.vec.Mat4.multVec4(_ras2ijk, tar3, res3);
  
  window.console.log('IJK Center');
  window.console.log(res3);
  
  window.console.log('RAS Center');
  window.console.log(_rascenter);
  
  // reslice 3 directions.
  // zoom padding fov
  // reslice direction
  // viewer size
  // from slicer
  
  // first slice creation!
  // 1- XYToIJK -> ToRAS
  // 2- Go through all XY Pixels ? Get full slice? Can turn on-off
  
  
  ///////////////////////////
  // Slice To RAS Transform:
  ///////////////////////////
  
  var _SliceToRAS = new goog.vec.Mat4.createFloat32Identity();
  // AXIAL MODE
  goog.vec.Mat4.setColumnValues(_SliceToRAS, 0, -1.0, 0.0, 0.0, 0.0);
  goog.vec.Mat4.setColumnValues(_SliceToRAS, 1, 0.0, 1.0, 0.0, 0.0);
  goog.vec.Mat4.setColumnValues(_SliceToRAS, 2, 0.0, 0.0, 1.0, 0.0);
  
  // SAGITTAL MODE
//  goog.vec.Mat4.setColumnValues(_SliceToRAS, 0, 0.0, -1.0, 0.0, 0.0);
//  goog.vec.Mat4.setColumnValues(_SliceToRAS, 1, 0.0, 0.0, 1.0, 0.0);
//  goog.vec.Mat4.setColumnValues(_SliceToRAS, 2, 1.0, 0.0, 0.0, 0.0);
  
  // CORONAL MODE
//  goog.vec.Mat4.setColumnValues(_SliceToRAS, 0, -1.0, 0.0, 0.0, 0.0);
//  goog.vec.Mat4.setColumnValues(_SliceToRAS, 1, 0.0, 0.0, 1.0, 0.0);
//  goog.vec.Mat4.setColumnValues(_SliceToRAS, 2, 0.0, 1.0, 0.0, 0.0);

  window.console.log("SliceToRAS");
  window.console.log(_SliceToRAS);
  
  ///////////////////////////
  // XY To Slice Transform:
  ///////////////////////////
  
  var _XYToSlice = new goog.vec.Mat4.createFloat32Identity();
  
  var _fov = [250.0, 250.0, 1.0];
  var _dimensions = [256, 256, 1];
  var _xyzOorigin = [0, 0, 0];
  
  // fill matrix if some cropping needed!
//  var _inc = 0;
//  var _spacing = [];
//  for (_inc = 0; _inc< 3; _inc++) {
//    _spacing[_inc] = _fov[_inc]/_dimensions[_inc];
//    goog.vec.Mat4.setElement(_XYToSlice, _inc, _inc, _spacing[_inc]);
//    goog.vec.Mat4.setElement(_XYToSlice, _inc, 3, -_fov[_inc]/2.0 + _xyzOorigin[_inc]);
//  }
  //xyToSlice->SetElement(2, 3, 0.);
  
  window.console.log("XYToSlice");
  window.console.log(_XYToSlice);
  
  
  ///////////////////////////
  // XY To IJK Transform:
  ///////////////////////////
  // RASToIJK * SliceToRAS * XYToSlice
  
  // XYToRAS
  var _XYToRAS = new goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.multMat(_XYToSlice, _SliceToRAS, _XYToRAS);
  
  // XYToIJK
  var _XYToIJK = new goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.multMat(_XYToRAS, _ras2ijk, _XYToIJK);
  
  ///////////////////////////
  // Create Slice in Arbitrary orientation
  ///////////////////////////
  var _sliceOrigin = new goog.vec.Vec3.createFloat32FromValues(
      _rascenter[0],
      _rascenter[1],
      _rascenter[2]);
  
  object._center = _sliceOrigin;
  
  var _sliceNormal = new goog.vec.Vec3.createFloat32FromValues(
      -.475,
      .722,
      .502);
  
  object._front = _sliceNormal;
  
  object._sliceOrigin = _sliceOrigin;
  object._sliceNormal = _sliceNormal;
  
  
  // get parametric representation
  // ax + by + cz + d = 0
  var _a = _sliceNormal[0];
  var _b = _sliceNormal[1];
  var _c = _sliceNormal[2];
  var _d = -_a*_sliceOrigin[0] -_b*_sliceOrigin[1] -_c*_sliceOrigin[2];
  
  window.console.log('a: ' + _a);
  window.console.log('b: ' + _b);
  window.console.log('c: ' + _c);
  window.console.log('d: ' + _d);
  
  // Get intersection of this plane with cube:
  //_rasdimensions
  //_rasorigin
  var _boundingBox = [Math.min(_rasorigin[0],_rasorigin[0] + _rasdimensions[0]),
                      Math.max(_rasorigin[0],_rasorigin[0] + _rasdimensions[0]),
                      Math.min(_rasorigin[1],_rasorigin[1] + _rasdimensions[1]),
                      Math.max(_rasorigin[1],_rasorigin[1] + _rasdimensions[1]),
                      Math.min(_rasorigin[2],_rasorigin[2] + _rasdimensions[2]),
                      Math.max(_rasorigin[2],_rasorigin[2] + _rasdimensions[2])
                      ];
  
  object._boundingBox = _boundingBox;
  window.console.log(_boundingBox);
  window.console.log(_boundingBox[1] - _boundingBox[0] );
  window.console.log(_boundingBox[3] - _boundingBox[2] );
  window.console.log(_boundingBox[5] - _boundingBox[4] );
//  var _boundingBox = [-.5,
//                      .5,
//                      -.5,
//                      .5,
//                      -.5,
//                      .5
//                      ];
  
  var _solutions = new Array();
  var _solutionsOut = new Array();
  
  X.TIMER(this._classname + '.bbox');
  
  // xmin, xmax, ymin, ymax, zmin, zmax
  for(var _i = 0; _i < 6; _i++){
    // 
    var _i2 = Math.floor(_i/2);
    var _i3 = (_i2 + 1)%3;
    var _i4 = (_i2 + 2)%3;
    var _j3 = (4 + (2*_i2))%6;
    for(var _j = 0; _j < 2; _j++){
      //window.console.log(_i + ' - ' + (2 + _j + (2*Math.floor(_i/2)))%6 );

      var _j2 = (2 + _j + (2*_i2))%6;
      
//      window.console.log('Bounding Box:');
//      window.console.log( _i + '-' + _j2);
//      window.console.log( _boundingBox[_i] + '-' + _boundingBox[_j2]);
//      window.console.log( 'Target Norms/Origins:');
//      window.console.log( _i2 + '-' + _i3);
      
      var _solution = (-(
          _sliceNormal[_i2]*(_boundingBox[_i] - _sliceOrigin[_i2])
          +
          _sliceNormal[_i3]*(_boundingBox[_j2] - _sliceOrigin[_i3])
          )
          /
          _sliceNormal[_i4]
          )
          +
          _sliceOrigin[_i4]
          ;
      
      //window.console.log(_sliceNormal[_i4]);
      // is solution in range?
//      window.console.log('Solution:');
//      window.console.log(_solution);
      
      if((_solution >= _boundingBox[_j3] && _solution <= _boundingBox[_j3+1])
          ||
          (_solution <= _boundingBox[_j3] && _solution >= _boundingBox[_j3+1])){
//        window.console.log('We got a match!!!!!');
        
        var _sol = new Array();
        _sol[_i2] = _boundingBox[_i];
        _sol[_i3] = _boundingBox[_j2];
        _sol[_i4] = _solution;

        _solutions.push(_sol);
      }
      else{
        var _sol = new Array();
        _sol[_i2] = _boundingBox[_i];
        _sol[_i3] = _boundingBox[_j2];
        _sol[_i4] = _solution;
        
        //_solutionsOut.push(_sol);
      }
    }
  }
  
  
  object._solutions = _solutions;
  object._solutionsOut = _solutionsOut;
  
  // rotate solutions around center of volume, towards 2d plane (z constant)
  // SlicetoXY
//  var _XYOrigin = new goog.vec.Vec3.createFloat32FromValues(
//      _rascenter[0],
//      _rascenter[1],
//      _rascenter[2]);
//  
//  var _XYNormal = new goog.vec.Vec3.createFloat32FromValues(
//      0,
//      0,
//      1);
//  // compute X and Y angles
//  var _angle =
//    Math.acos( goog.vec.Vec3.dot(_sliceNormal, _XYNormal) /
//        (goog.vec.Vec3.magnitude(_sliceNormal)*goog.vec.Vec3.magnitude(_XYNormal)
//            ));
  
  
  // rotation matrix
  
//  var _sliceOrigin = new goog.vec.Vec3.createFloat32FromValues(
//      _rascenter[0],
//      _rascenter[1],
//      _rascenter[2]);
  
  var _v = _sliceNormal;
  var _z = new goog.vec.Vec3.createFloat32FromValues(0, 0, 1);

  _q1 = new goog.vec.Mat4.createFloat32Identity();
  
  // no rotation needed if we are in the z plane already

  if(!goog.vec.Vec3.equals(_v,_z))
  {
    window.console.log('INSIDE');
    
    var _vp = new goog.vec.Vec3.createFloat32FromValues(
      _v[0]/goog.vec.Vec3.magnitude(_v),
      _v[1]/goog.vec.Vec3.magnitude(_v),
      _v[2]/goog.vec.Vec3.magnitude(_v));

  
  var _ap = _vp[0];
  var _bp = _vp[1];
  var _cp = _vp[2];
  
  var _teta = Math.acos(_cp);
  
  var _r = new goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.cross(_vp, _z, _r);
  
  var _rp = new goog.vec.Vec3.createFloat32FromValues(
      _r[0]/goog.vec.Vec3.magnitude(_r),
      _r[1]/goog.vec.Vec3.magnitude(_r),
      _r[2]/goog.vec.Vec3.magnitude(_r));
  
  var _ct = Math.cos(_teta);
  var _st = Math.sin(_teta);
    
  var a = Math.cos(_teta/2);
  var b = Math.sin(_teta/2)*_rp[0];
  var c = Math.sin(_teta/2)*_rp[1];
  var d = Math.sin(_teta/2)*_rp[2];
  
  goog.vec.Mat4.setRowValues(_q1,
      0,
      (a*a+b*b-c*c-d*d),
      2*(b*c-a*d),
      2*(b*d+a*c),
      0
      );
  goog.vec.Mat4.setRowValues(_q1,
      1,
      2*(b*c+a*d),
      (a*a+c*c-b*b-d*d),
      2*(c*d-a*b),
      0
      );
  goog.vec.Mat4.setRowValues(_q1,
      2,
      2*(b*d-a*c ),
      2*(c*d+a*b),
      (a*a+d*d-c*c-b*b),
      0
      );
}
//  // Apply transform to each point!
  var _solutionsYX = new Array();
  for (var i = 0; i < _solutions.length; ++i) {
    var tar2 = new goog.vec.Vec4.createFloat32FromValues(_solutions[i][0], _solutions[i][1], _solutions[i][2], 1);
    var res2 = new goog.vec.Vec4.createFloat32();
    goog.vec.Mat4.multVec4(_q1, tar2, res2);

    var _sol = new Array();
    _sol[0] = res2[0];
    _sol[1] = res2[1];
    _sol[2] = res2[2];
    
    _solutionsYX.push(_sol);
  }
  
  
  object._solutionsXY = _solutionsYX;
  
  // get new spacing
  var _spacingXY = new Array();
  var tar = new goog.vec.Vec4.createFloat32FromValues(_rasorigin[0], _rasorigin[1], _rasorigin[2], 1);
  var res = new goog.vec.Vec4.createFloat32();
  goog.vec.Mat4.multVec4(_q1, tar, res);
 
  var tar2 = new goog.vec.Vec4.createFloat32FromValues(_rasorigin[0] + _rasspacing[0], _rasorigin[1] + _rasspacing[1], _rasorigin[2] + _rasspacing[2], 1);
  var res2 = new goog.vec.Vec4.createFloat32();
  goog.vec.Mat4.multVec4(_q1, tar2, res2);
  
  window.console.log(' XY SPACING ');
  window.console.log(res2[0] - res[0]);
  window.console.log(res2[1] - res[1]);
  window.console.log(res2[2] - res[2]);
  
  window.console.log(' RAS SPACING ');
  window.console.log(_rasspacing[0]);
  window.console.log(_rasspacing[1]);
  window.console.log(_rasspacing[2]);
  _xyspacing = [res2[0] - res[0], res2[1] - res[1], res2[2] - res[2]];
  
//  var tar2 = new goog.vec.Vec4.createFloat32FromValues(MRI.pixdim[1], MRI.pixdim[2], MRI.pixdim[3], 1);
//  var res2 = new goog.vec.Vec4.createFloat32();
//  goog.vec.Mat4.multVec4(IJKToRAS, tar2, res2);
//  
//  
//  for (var i = 0; i < _solutions.length; ++i) {
//    var tar2 = new goog.vec.Vec4.createFloat32FromValues(_solutions[i][0], _solutions[i][1], _solutions[i][2], 1);
//    var res2 = new goog.vec.Vec4.createFloat32();
//    goog.vec.Mat4.multVec4(_q1, tar2, res2);
//
//
//    window.console.log(res2);
//    var _sol = new Array();
//    _sol[0] = res2[0];
//    _sol[1] = res2[1];
//    _sol[2] = res2[2];
//    
//    _solutionsYX.push(_sol);
//  }
  
  // get XY bounding box!
  var _xyBB = [Number.MAX_VALUE, Number.MIN_VALUE,
               Number.MAX_VALUE, Number.MIN_VALUE,
               Number.MAX_VALUE, Number.MIN_VALUE];
  for (var i = 0; i < _solutionsYX.length; ++i) {
    if(_solutionsYX[i][0] < _xyBB[0]){
      _xyBB[0] = _solutionsYX[i][0];
    }
    
    if(_solutionsYX[i][0] > _xyBB[1]){
      _xyBB[1] = _solutionsYX[i][0];
    }
    
    if(_solutionsYX[i][1] < _xyBB[2]){
      _xyBB[2] = _solutionsYX[i][1];
    }
    
    if(_solutionsYX[i][1] > _xyBB[3]){
      _xyBB[3] = _solutionsYX[i][1];
    }
    
    if(_solutionsYX[i][2] < _xyBB[4]){
      _xyBB[4] = _solutionsYX[i][2];
    }
    
    if(_solutionsYX[i][2] > _xyBB[5]){
      _xyBB[5] = _solutionsYX[i][2];
    }
  }

  object._xyBB = _xyBB;
  window.console.log("XY BB " + _xyBB);

  var _q2 = new goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.invert(_q1, _q2);
  
  var _xyCenter = new goog.vec.Vec4.createFloat32FromValues(_xyBB[0] + (_xyBB[1] - _xyBB[0])/2,_xyBB[2] + (_xyBB[3] - _xyBB[2])/2, _xyBB[4] + (_xyBB[5] - _xyBB[4])/2,0);
  var _RASCenter = new goog.vec.Vec4.createFloat32();
  goog.vec.Mat4.multMat(_q2,_xyCenter, _RASCenter);
  object._sliceCenter = [_RASCenter[0],
      _RASCenter[1], _RASCenter[2]];
  
  window.console.log("XY RAS CENTER ");
  window.console.log(  object._sliceCenter);
  
  window.console.log("RAS CENTER ");
  window.console.log(  _rascenter);
  
  var _xyRASBB = [Number.MAX_VALUE, Number.MIN_VALUE,
                  Number.MAX_VALUE, Number.MIN_VALUE,
                  Number.MAX_VALUE, Number.MIN_VALUE];
  for (var i = 0; i < 2; ++i) {
    for (var j = 0; j < 2; ++j){
      // get point to convert to RAS
      //
      var _XYPoint = new goog.vec.Vec4.createFloat32FromValues(_xyBB[i], _xyBB[j+2], _xyBB[4], 0);
      // To RAS!
      var _RASPoint = new goog.vec.Vec4.createFloat32();
      goog.vec.Mat4.multVec4(_q1, tar, res);
      goog.vec.Mat4.multMat(_q2,_XYPoint, _RASPoint);
    // i
    // 2 + j
    if(_RASPoint[0] < _xyRASBB[0]){
      _xyRASBB[0] = _RASPoint[0];
    }
    
    if(_RASPoint[0] > _xyRASBB[1]){
      _xyRASBB[1] = _RASPoint[0];
    }
    
    if(_RASPoint[1] < _xyRASBB[2]){
      _xyRASBB[2] = _RASPoint[1];
    }
    
    if(_RASPoint[1] > _xyRASBB[3]){
      _xyRASBB[3] = _RASPoint[1];
    }
    
    if(_RASPoint[2] < _xyRASBB[4]){
      _xyRASBB[4] = _RASPoint[2];
    }
    
    if(_RASPoint[2] > _xyRASBB[5]){
      _xyRASBB[5] = _RASPoint[2];
    }
    }
  }
  object._xyRASBB = _xyRASBB;
  window.console.log("RAS BB " + _xyRASBB);
  
  window.console.log("RAS CENTER ");
  window.console.log( (_rasorigin[0] + (_xyRASBB[1] - _xyRASBB[0])/2) + ' - ' + (_rasorigin[1] + (_xyRASBB[3] - _xyRASBB[2])/2)+ ' - ' +  (_rasorigin[2] + (_xyRASBB[5] - _xyRASBB[4])/2));
  //object._test = [(_rasorigin[0] + (_xyRASBB[1] - _xyRASBB[0])/2) ,(_rasorigin[1] + (_xyRASBB[3] - _xyRASBB[2])/2),(_rasorigin[2] + (_xyRASBB[5] - _xyRASBB[4])/2)];
  
  
  var res = new goog.vec.Vec4.createFloat32();
  var res2 = new goog.vec.Vec4.createFloat32();
  
  var _wmin =  Math.floor(_xyBB[0]);
  var _wmax =  Math.ceil(_xyBB[1]);
  var _woffset = _xyBB[0] - _wmin + _wmax - _xyBB[1];
  var _swidth = _wmax - _wmin;
  
  var _hmin = Math.floor(_xyBB[2]);
  var _hmax = Math.ceil(_xyBB[3]);
  var _hoffset = _xyBB[2] - _hmin + _hmax - _xyBB[3];
  var _sheight = _hmax - _hmin;
  
  object._SW = _swidth;
  object._SH = _sheight;
  
  window.console.log('woffset: ' + _woffset);
  window.console.log('hoffset: ' + _hoffset);
  
  window.console.log(  'WM: ' + _wmin);
  window.console.log(  'WM: ' + _wmax);
  
  
  window.console.log(  'HM: ' + _hmin);
  window.console.log(  'HM: ' + _hmax);
  
  window.console.log(  'SW: ' + _swidth);
  window.console.log(  'SH: ' + _sheight);
  
  var _resX = 1;
  var _resY = 1;
  var _epsilon = 0.0000001;
  
  // new width, given spacing
  window.console.log(  'STW: ' + _swidth/_resX);
  window.console.log(  'STH: ' + _sheight/_resY);
  
  // How many pixels are we expecting the raw data
  var _cswidth = Math.ceil(_swidth/_resX);
  var _csheight = Math.ceil(_sheight/_resY);
  
  var _csize =  _cswidth*_csheight;
  var textureSize = 4 * _csize;
  var textureForCurrentSlice = new Uint8Array(textureSize);
  var pixelTexture = new X.texture();
  pixelTexture._rawDataWidth = _cswidth;
  pixelTexture._rawDataHeight = _csheight;
  
  window.console.log(  'TW: ' + pixelTexture._rawDataWidth);
  window.console.log(  'TH: ' + pixelTexture._rawDataHeight);
  
  // rigth
  var _right = new goog.vec.Vec3.createFloat32FromValues(1, 0, 0);
  var _rright = new goog.vec.Vec3.createFloat32();
  goog.vec.Mat4.multVec3(_q2, _right, _rright);
  object._right = _rright;
  
  window.console.log( _rright);
  
  // up
  var _up = new goog.vec.Vec3.createFloat32FromValues(0, 1, 0);
  var _rup = new goog.vec.Vec3.createFloat32();
  goog.vec.Mat4.multVec3(_q2, _up, _rup);
  object._up= _rup;
  
  window.console.log(_rup);

  
  // return ijk indices
  var _mappedPoints = new Array();
  var _mappedPointsIJK = new Array();
  
  var _count = 0;
  var _p = 0;
  
  window.console.log(_dim);
  
  var tar = new goog.vec.Vec4.createFloat32FromValues(i, j, _xyBB[4], 1);
  var tttt = goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.multMat(_ras2ijk,_q2, tttt);
  
  for (var j = _hmin; j <= _hmax - _epsilon; j+=_resY) {
    var _ci = 0;
for (var i = _wmin; i <= _wmax - _epsilon; i+=_resX) {
    //
    tar[0] = i;
    tar[1] = j;
  // convert to RAS
    // convert to IJK
    goog.vec.Mat4.multVec4(tttt, tar, res2);
    
    // get value if there is a match, trnasparent if no match!
    var textureStartIndex = _p * 4;
    
    if( (0 <= res2[0]) && (res2[0] < _dim[0] ) &&
        (0 <= res2[1]) && (res2[1] < _dim[1] ) &&
        (0 <= res2[2]) && (res2[2] < _dim[2] )){
      // map to 0 if necessary
      
      var _k = Math.floor(res2[2]);
      var _j = Math.floor(res2[1]);
      var _i = Math.floor(res2[0]);
      
//      window.console.log(image);
      
      var pixval = image[_k][_j][_i];
//      textureForCurrentSlice[textureStartIndex] = pixval;
//      textureForCurrentSlice[textureStartIndex] = 0;
      //textureForCurrentSlice[textureStartIndex] = 255*_count/_csize;
      textureForCurrentSlice[textureStartIndex] = pixval;
//      textureForCurrentSlice[textureStartIndex] = 255*_ci/(_wmax - _wmin);
      textureForCurrentSlice[++textureStartIndex] = pixval;
      //textureForCurrentSlice[++textureStartIndex] = pixval;
      textureForCurrentSlice[++textureStartIndex] = pixval;
      textureForCurrentSlice[++textureStartIndex] = 255;
      
//      var _sol = new Array();
//      _sol[0] = res[0];
//      _sol[1] = res[1];
//      _sol[2] = res[2];
//
//      _mappedPoints.push(_sol);
//      
//      var _sol2 = new Array();
//      _sol2[0] = _k;
//      _sol2[1] = _j;
//      _sol2[2] = _i;
//
//      _mappedPointsIJK.push(_sol2);
    }
    else{
      textureForCurrentSlice[textureStartIndex] = 255*_count/_csize;
      textureForCurrentSlice[++textureStartIndex] = 255;
      textureForCurrentSlice[++textureStartIndex] = 0;
      textureForCurrentSlice[++textureStartIndex] = 0;
    }
    
    

    _ci++;
    _p++;

    //var _dim = object._dimensions;
    //realImage
    //image
//    window.console.log(res2);
    
    _count++;
    
    

    } 

  }
  
  window.console.log('i: ' + i);
  window.console.log('j: ' + j);
  
  object._mappedPoints = _mappedPoints;
  object._mappedPointsIJK = _mappedPointsIJK;
  

  pixelTexture._rawData = textureForCurrentSlice;
  object._texture = pixelTexture;
  
  X.TIMERSTOP(this._classname + '.RRESLICE');
  
  
  var tmpreal = realImage;
  window.console.log(realImage)
  
  
  // get texture with spacing 1!
  
  // Create Slice in relevant orientation and fill it:
  ///////////////////////////
  //_SliceToRAS
  
  // get intersection with Sagittal Plane
  // Sagittal origin location
  var _sagittalOrigin = new goog.vec.Vec3.createFloat32FromValues(
      1,
      0,
      0);
  // R normal
  var _sagittalNormal = new goog.vec.Vec3.createFloat32FromValues(
      1,
      -2,
      3);
  

  
  // get angle between planes
  // angle = arccos(\n1.n2|/||n1||.||n2||)
  var _angle =
    Math.acos( goog.vec.Vec3.dot(_sliceNormal, _sagittalNormal) /
        (goog.vec.Vec3.magnitude(_sliceNormal)*goog.vec.Vec3.magnitude(_sagittalNormal)
            ));
//  window.console.log('ANGLE');
//  window.console.log(_angle);
//  window.console.log(360*_angle/(2*Math.PI));
  
  if(!_angle){
  // if parallel, we know the intersection
//    window.console.log('Slice AND BoundingBox are //');
  }
  else{
  // else let's find the intersction

    
  // get line vector
    var _intersectionLine = new goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.cross(_sliceNormal, _sagittalNormal, _intersectionLine);
  // get line point
  // set z = 0
  var _z = 0;
  var _y =
    _sliceNormal[0]/(_sliceNormal[1]*_sagittalNormal[0] - _sliceNormal[0]*_sagittalNormal[1])
    *
    (_sagittalNormal[0]*(_sliceOrigin[2]*_sliceNormal[2] + _sliceOrigin[1]*_sliceNormal[1] + _sliceOrigin[0]*_sliceNormal[0] - _sagittalOrigin[0]*_sagittalNormal[0])/_sliceNormal[0]
    - _sagittalOrigin[1]*_sagittalNormal[1]
    - _sagittalOrigin[2]*_sagittalNormal[2]
    );
  
//  window.console.log('Y: '+ _y);
  
  var _x = ((_sliceNormal[2]*_sliceOrigin[2] - _sliceOrigin[1]*(_y - _sliceNormal[1]))
    / _sliceNormal[0])
    + _sliceOrigin[0];
  
//  window.console.log('X: '+ _x);
    
  }

  // AXIAL MODE
  goog.vec.Mat4.setColumnValues(_SliceToRAS, 0, -1.0, 0.0, 0.0, 0.0);
  goog.vec.Mat4.setColumnValues(_SliceToRAS, 1, 0.0, 1.0, 0.0, 0.0);
  goog.vec.Mat4.setColumnValues(_SliceToRAS, 2, 0.0, 0.0, 1.0, 0.0);
  
  // get intersection with L
  //....
  
  // Create Slice in Axial orientation
  // Fill it!
  // Loop through RS, A constant
  // RS, using RAS spacing
  // for each value, map to IJK (RASToIJK) and that's it, we have the value!
  
  // Create Slice in Coronal orientation
  
  // Create Slice in Sagittal orientation
  
  
  // Then, on demand Reslicing - If slice empty, reslice it!
  
  // If VR, reslice all!
  // 2D slices?
  // XYToIJK? -> EZ :) We have XYToSlice, Slice->IJK Straight forward!
  
//  // Create Slice
//  var _slice = new X.slice();
// var _front = [
//      goog.vec.Mat4.getElement(_SliceToRAS, 0, 0),
//      goog.vec.Mat4.getElement(_SliceToRAS, 1, 0),
//      goog.vec.Mat4.getElement(_SliceToRAS, 2, 0)];
//  var _up = [
//      goog.vec.Mat4.getElement(_SliceToRAS, 0, 1),
//      goog.vec.Mat4.getElement(_SliceToRAS, 1, 1),
//      goog.vec.Mat4.getElement(_SliceToRAS, 2, 1)];
//  var _right = [
//      goog.vec.Mat4.getElement(_SliceToRAS, 0, 2),
//      goog.vec.Mat4.getElement(_SliceToRAS, 1, 2),
//      goog.vec.Mat4.getElement(_SliceToRAS, 2, 2)];
//      //_rasorigin
//  _slice.setup(_rascenter, _front, _up, _right, _dimensions[0], _dimensions[1], true, [ 1, 0, 0 ]);
//  // map slice to volume
//  _slice._volume = /** @type {X.volume} */(object);
//  _slice.visible = true;
//  
  // Fill Slice
  // Loop through XY and get values
//  var _xinc = 0, _yinc = 0;
//  for(_xinc = 0; _xinc<= _dimensions[0]; _xinc++){
//    for(_yinc = 0; _yinc<= _dimensions[1]; _yinc++){
//      // print IJK coordinates!
//      // X, Y, Z=1, 1
//      var xyzVec = new goog.vec.Vec4.createFloat32FromValues(_xinc, _yinc, 1, 1);
//      var resultVec = new goog.vec.Vec4.createFloat32();
//      goog.vec.Mat4.multVec4(_XYToIJK, xyzVec, resultVec);
//      // if in range of IJK image, print values and coordinates
//      window.console.log(resultVec);
//    }
//  }
  
  // update slice size
//  this->FieldOfView[0] = 250.0;
//  this->FieldOfView[1] = 250.0;
//  this->FieldOfView[2] = 1.0;
//
//  this->Dimensions[0] = 256;
//  this->Dimensions[1] = 256;
//  this->Dimensions[2] = 1;
//  xyToSlice->Identity();
//  if (this->Dimensions[0] > 0 &&
//      this->Dimensions[1] > 0 &&
//      this->Dimensions[2] > 0)
//    {
//    for (i = 0; i < 3; i++)
//      {
//      spacing[i] = this->FieldOfView[i] / this->Dimensions[i];
//      xyToSlice->SetElement(i, i, spacing[i]);
//      xyToSlice->SetElement(i, 3, -this->FieldOfView[i] / 2. + this->XYZOrigin[i]);
//      }
//    //vtkWarningMacro( << "FieldOfView[2] = " << this->FieldOfView[2] << ", Dimensions[2] = " << this->Dimensions[2] );
//    //xyToSlice->SetElement(2, 2, 1.);
//
//    xyToSlice->SetElement(2, 3, 0.);
//    }

  
  // 2nd slice
  
  // fill slice
//  for(){
//    for(){
//      // conve
//    }
//  }
  
  // reslice through A
  
  // relisce
  // Reslice middle plane only - reslice on demand later on!
  // Convert to IJK, get pixel value and map it to texture!
  
  // labelmap and color tables
  var hasLabelMap = object._labelmap != null;
  var _colorTable = null;
  if (object._colortable) {

    _colorTable = object._colortable._map;

  }

  // allocate and fill volume
  // rows, cols and slices (ijk dimensions)
  var _dim = object._dimensions;
  var _spacing = object._spacing;
  
  var datastream = object._data;
  var image = new Array(_dim[2]);
  // use real image to return real values
  var realImage = new Array(_dim[2]);
  // XYS to IJK
  // (fill volume)
  var _norm_cosine = object._normcosine;
  var _nb_pix_per_slice = _dim[0] * _dim[1];
  var _pix_value = 0;
  var _i = 0;
  var _j = 0;
  var _k = 0;
  var _data_pointer = 0;
  
  var _pix_val = 0;
  // IJK to XYS
  // reslice image (Axial, Sagittal, Coronal)
  var xyz = 0;
  for (xyz = 0; xyz < 3; xyz++) {

    var _ti = xyz;
    var _tj = (_ti + 1) % 3;
    var _tk = (_ti + 2) % 3;
    
    var textureSize = 4 * _dim[_ti] * _dim[_tj];
    _k = 0;
    var imax = _dim[_ti];
    var jmax = _dim[_tj];
    var kmax = _dim[_tk];
    // CREATE SLICE in normal direction
    var halfDimension = (kmax - 1) / 2;
    var _indexCenter = halfDimension;
    // right = i direction
    var _right = _norm_cosine[_ti];
    // up = j direction
    var _up = _norm_cosine[_tj];
    // front = normal direction
    var _front = _norm_cosine[_tk];

    // color
    var _color = [ 1, 1, 1 ];
    if (_norm_cosine[_tk][2] != 0) {
      _color = [ 1, 0, 0 ];
    } else if (_norm_cosine[_tk][1] != 0) {
      _color = [ 0, 1, 0 ];
    } else {
      _color = [ 1, 1, 0 ];
    }

    // size
    var _width = imax * _spacing[_ti];
    var _height = jmax * _spacing[_tj];
    if (_norm_cosine[2][1] != 0) {
      // if coronally acquired
      var _tmp = _width;
      _width = _height;
      _height = _tmp;
    }

    for (_k = 0; _k < kmax; _k++) {
      _j = 0;
      var _p = 0;
      // CREATE SLICE
      // position
      var _position = (-halfDimension * _spacing[_tk]) + (_k * _spacing[_tk]);
      // center
      // move center along normal
      // 0 should be hard coded
      // find normal direction and use it!
      var _center = [ _rascenter[0] + _norm_cosine[_tk][0] * _position,
                      _rascenter[1] + _norm_cosine[_tk][1] * _position,
                      _rascenter[2] + _norm_cosine[_tk][2] * _position];
      // create the slice
      // .. new slice
      var _slice = new X.slice();
      var borders = true;
      // for labelmaps, don't create the borders since this would create them 2x
      // hasLabelMap == true means we are the volume
      // hasLabelMap == false means we are the labelmap
      if (goog.isDefAndNotNull(object._volume) && !hasLabelMap) {
        borders = false;
      }
      _slice.setup(_center, _front, _up, _right, _width, _height, borders,
          _color);
      // map slice to volume
      _slice._volume = /** @type {X.volume} */(object);
      _slice.visible = false;

      var textureForCurrentSlice = new Uint8Array(textureSize);
      for (_j = 0; _j < jmax; _j++) {
        _i = 0;
        for (_i = 0; _i < imax; _i++) {
//          _pix_val = 0;
//          // rotate indices depending on which orientation we are targetting
//          if (xyz == 0) {
//            _pix_val = realImage[_k][_j][_i];
//          } else if (xyz == 1) {
//            _pix_val = realImage[_j][_i][_k];
//          } else {
//            _pix_val = realImage[_i][_k][_j];
//          }
//          var pixelValue_r = 0;
//          var pixelValue_g = 0;
//          var pixelValue_b = 0;
//          var pixelValue_a = 0;
//          if (_colorTable) {
//            // color table!
//            var lookupValue = _colorTable.get(Math.floor(_pix_val));
//            // check for out of range and use the last label value in this case
//            if (!lookupValue) {
//              lookupValue = [ 0, 1, 0.1, 0.2, 1 ];
//            }
//            pixelValue_r = 255 * lookupValue[1];
//            pixelValue_g = 255 * lookupValue[2];
//            pixelValue_b = 255 * lookupValue[3];
//            pixelValue_a = 255 * lookupValue[4];
//          } else {
//            pixelValue_r = pixelValue_g = pixelValue_b = 255 * (_pix_val / object._max);
//            pixelValue_a = 255;
//          }
//          var textureStartIndex = _p * 4;
//          textureForCurrentSlice[textureStartIndex] = pixelValue_r;
//          textureForCurrentSlice[++textureStartIndex] = pixelValue_g;
//          textureForCurrentSlice[++textureStartIndex] = pixelValue_b;
//          textureForCurrentSlice[++textureStartIndex] = pixelValue_a;
//          _p++;
        }
      }
      var pixelTexture = new X.texture();
      pixelTexture._rawData = textureForCurrentSlice;
      pixelTexture._rawDataWidth = imax;
      pixelTexture._rawDataHeight = jmax;
      _slice._texture = pixelTexture;
      // push slice
      if (object._orientation[_tk] > 0) {
        object._children[xyz]._children.push(_slice);
      } else {
        object._children[xyz]._children.unshift(_slice);
      }
      if (hasLabelMap) {
        // if this object has a labelmap,
        // we have it loaded at this point (for sure)
        // ..so we can attach it as the second texture to this slice
        _slice._labelmap = object._labelmap._children[xyz]._children[_k]._texture;
      }
    }
    // set slice index
    // by default, all the 'middle' slices are shown
    if (xyz == 0) {
      object._indexX = halfDimension;
      object._indexXold = halfDimension;
    } else if (xyz == 1) {
      object._indexY = halfDimension;
      object._indexYold = halfDimension;
    } else if (xyz == 2) {
      object._indexZ = halfDimension;
      object._indexZold = halfDimension;
    }
    
    // full reslice?
    if (!object._reslicing) {
      break;
    }
  }

  X.TIMERSTOP(this._classname + '.reslice');
  
  return tmpreal;
  
  
  
  X.TIMERSTOP(this._classname + '.reslice');
  
  
  // labelmap and color tables
  var hasLabelMap = object._labelmap != null;
  var _colorTable = null;
  if (object._colortable) {

    _colorTable = object._colortable._map;

  }

  // allocate and fill volume
  // rows, cols and slices (ijk dimensions)
  var _dim = object._dimensions;
  var _spacing = object._spacing;
  
  var datastream = object._data;
  var image = new Array(_dim[2]);
  // use real image to return real values
  var realImage = new Array(_dim[2]);
  // XYS to IJK
  // (fill volume)
  var _norm_cosine = object._normcosine;
  var _nb_pix_per_slice = _dim[0] * _dim[1];
  var _pix_value = 0;
  var _i = 0;
  var _j = 0;
  var _k = 0;
  var _data_pointer = 0;
  for (_k = 0; _k < _dim[2]; _k++) {

    // get current slice
    var _current_k = datastream.subarray(_k * (_nb_pix_per_slice), (_k + 1)
        * _nb_pix_per_slice);
    // now loop through all pixels of the current slice
    _i = 0;
    _j = 0;
    _data_pointer = 0; // just a counter
    
    image[_k] = new Array(_dim[1]);
    realImage[_k] = new Array(_dim[1]);
    for (_j = 0; _j < _dim[1]; _j++) {

    image[_k][_j] = new object._data.constructor(_dim[0]);
    realImage[_k][_j] = new object._data.constructor(_dim[0]);
    for (_i = 0; _i < _dim[0]; _i++) {

        // go through row (i) first :)
        // 1 2 3 4 5 6 ..
        // .. .... .. . .
        //
        // not
        // 1 .. ....
        // 2 ...
        // map pixel values
        _pix_value = _current_k[_data_pointer];
        image[_k][_j][_i] = 255 * (_pix_value / object._max);
        realImage[_k][_j][_i] = _pix_value;
        _data_pointer++;

      }

    }

  }

  var _pix_val = 0;
  // IJK to XYS
  // reslice image (Axial, Sagittal, Coronal)
  var xyz = 0;
  for (xyz = 0; xyz < 3; xyz++) {

    var _ti = xyz;
    var _tj = (_ti + 1) % 3;
    var _tk = (_ti + 2) % 3;
    
    var textureSize = 4 * _dim[_ti] * _dim[_tj];
    _k = 0;
    var imax = _dim[_ti];
    var jmax = _dim[_tj];
    var kmax = _dim[_tk];
    // CREATE SLICE in normal direction
    var halfDimension = (kmax - 1) / 2;
    var _indexCenter = halfDimension;
    // right = i direction
    var _right = _norm_cosine[_ti];
    // up = j direction
    var _up = _norm_cosine[_tj];
    // front = normal direction
    var _front = _norm_cosine[_tk];

    // color
    var _color = [ 1, 1, 1 ];
    if (_norm_cosine[_tk][2] != 0) {
      _color = [ 1, 0, 0 ];
    } else if (_norm_cosine[_tk][1] != 0) {
      _color = [ 0, 1, 0 ];
    } else {
      _color = [ 1, 1, 0 ];
    }

    // size
    var _width = imax * _spacing[_ti];
    var _height = jmax * _spacing[_tj];
    if (_norm_cosine[2][1] != 0) {
      // if coronally acquired
      var _tmp = _width;
      _width = _height;
      _height = _tmp;
    }

    for (_k = 0; _k < kmax; _k++) {
      _j = 0;
      var _p = 0;
      // CREATE SLICE
      // position
      var _position = (-halfDimension * _spacing[_tk]) + (_k * _spacing[_tk]);
      // center
      // move center along normal
      // 0 should be hard coded
      // find normal direction and use it!
      var _center = [ object._center[0] + _norm_cosine[_tk][0] * _position,
                      object._center[1] + _norm_cosine[_tk][1] * _position,
                      object._center[2] + _norm_cosine[_tk][2] * _position];
      // create the slice
      // .. new slice
      var _slice = new X.slice();
      var borders = true;
      // for labelmaps, don't create the borders since this would create them 2x
      // hasLabelMap == true means we are the volume
      // hasLabelMap == false means we are the labelmap
      if (goog.isDefAndNotNull(object._volume) && !hasLabelMap) {
        borders = false;
      }
      _slice.setup(_center, _front, _up, _right, _width, _height, borders,
          _color);
      // map slice to volume
      _slice._volume = /** @type {X.volume} */(object);
      _slice.visible = false;

      var textureForCurrentSlice = new Uint8Array(textureSize);
      for (_j = 0; _j < jmax; _j++) {
        _i = 0;
        for (_i = 0; _i < imax; _i++) {
          _pix_val = 0;
          // rotate indices depending on which orientation we are targetting
          if (xyz == 0) {
            _pix_val = realImage[_k][_j][_i];
          } else if (xyz == 1) {
            _pix_val = realImage[_j][_i][_k];
          } else {
            _pix_val = realImage[_i][_k][_j];
          }
          var pixelValue_r = 0;
          var pixelValue_g = 0;
          var pixelValue_b = 0;
          var pixelValue_a = 0;
          if (_colorTable) {
            // color table!
            var lookupValue = _colorTable.get(Math.floor(_pix_val));
            // check for out of range and use the last label value in this case
            if (!lookupValue) {
              lookupValue = [ 0, 1, 0.1, 0.2, 1 ];
            }
            pixelValue_r = 255 * lookupValue[1];
            pixelValue_g = 255 * lookupValue[2];
            pixelValue_b = 255 * lookupValue[3];
            pixelValue_a = 255 * lookupValue[4];
          } else {
            pixelValue_r = pixelValue_g = pixelValue_b = 255 * (_pix_val / object._max);
            pixelValue_a = 255;
          }
          var textureStartIndex = _p * 4;
          textureForCurrentSlice[textureStartIndex] = pixelValue_r;
          textureForCurrentSlice[++textureStartIndex] = pixelValue_g;
          textureForCurrentSlice[++textureStartIndex] = pixelValue_b;
          textureForCurrentSlice[++textureStartIndex] = pixelValue_a;
          _p++;
        }
      }
      var pixelTexture = new X.texture();
      pixelTexture._rawData = textureForCurrentSlice;
      pixelTexture._rawDataWidth = imax;
      pixelTexture._rawDataHeight = jmax;
      _slice._texture = pixelTexture;
      // push slice
      if (object._orientation[_tk] > 0) {
        object._children[xyz]._children.push(_slice);
      } else {
        object._children[xyz]._children.unshift(_slice);
      }
      if (hasLabelMap) {
        // if this object has a labelmap,
        // we have it loaded at this point (for sure)
        // ..so we can attach it as the second texture to this slice
        _slice._labelmap = object._labelmap._children[xyz]._children[_k]._texture;
      }
    }
    // set slice index
    // by default, all the 'middle' slices are shown
    if (xyz == 0) {
      object._indexX = halfDimension;
      object._indexXold = halfDimension;
    } else if (xyz == 1) {
      object._indexY = halfDimension;
      object._indexYold = halfDimension;
    } else if (xyz == 2) {
      object._indexZ = halfDimension;
      object._indexZold = halfDimension;
    }
    
    // full reslice?
    if (!object._reslicing) {
      break;
    }
  }

  X.TIMERSTOP(this._classname + '.reslice');

  return realImage;

};

