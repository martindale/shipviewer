// If another instance of the Shipviewer is loading the external JSONP resources, then we wait for it and add instance of ourselves ot the waiting list.
function CCPShipViewer(options) {
  function tick() {
    requestAnimFrame(tick), device.Tick()
  }

  function Render() {
    if (scene.objects.length > 1 && ref.selectedShip != null && !shipAssembled) {
      for (var a = 0; a < scene.objects.length; ++a) if (typeof scene.objects[a]._objectLoaded != "undefined" && !scene.objects[a]._objectLoaded) return !0;
      shipAssembled = !0;
      for (var a = 0; a + 1 < scene.objects.length; ++a) for (var b = 0; b < scene.objects[a].locators.length; ++b) if (scene.objects[a].locators[b].name == "locator_attach_" + modules[a]) {
        var c = scene.objects[a].locators[b].transform;
        mat4.translate(scene.objects[a].transform, [c[12], c[13], c[14]], scene.objects[a + 1].transform);
        break
      }
    }
    if (ref.pendingResources == 0 && ref.selectedShip != null) {
      if (ship && ship.boundingSphereCenter && minZoomDistance == -1) {
        var d = ship.boundingSphereRadius;
        loadingShip && ref.afterShipLoaded(), UpdateTurrets(), ship.boosters = resMan.GetObject(shipBooster, "EveBoosterSet"), minZoomDistance = settings.minZoomDistance || -1, minZoomDistance == -1 && ref.showOverlay ? minZoomDistance = d * 2.5 + 1 : minZoomDistance == -1 && (minZoomDistance = d * 1.3), ref.showOverlay ? camera.distance = minZoomDistance * 1.08 : camera.distance = minZoomDistance * 1.5, camera.currDistance = camera.distance * 2, ship.boosterGain = 0
      }
      if (showFPS) {
        var e = new Date;
        e = e.getTime(), prevTime == 0 && (prevTime = e);
        var f = (e - prevTime) * .001;
        document.getElementById(ref.containerId + "_FPS").innerHTML = "FPS: " + Math.floor(1 / f + .5), prevTime = e, e = null
      }
      camera.Update(f), scene.Update(f), device.SetStandardStates(device.RM_OPAQUE), device.gl.clearColor(0, 0, 0, 0), device.gl.clearDepth(1), device.gl.viewport(0, 0, device.gl.viewportWidth, device.gl.viewportHeight), device.gl.clear(device.gl.COLOR_BUFFER_BIT | device.gl.DEPTH_BUFFER_BIT), ship && ship.boosterGain < boosterGain && (ship.boosterGain += boosterGain / 80);
      if (quality == 3) {
        var g = camera.GetView(),
          h = mat4.inverse(g, mat4.create()),
          i = mat4.multiplyVec4(h, [1, 1, 2, 0], quat4.create());
        vec3.set(i, scene.sunDirection)
      }
      device.SetProjection(camera.GetProjection()), device.SetView(camera.GetView()), scene.Render(), ref.postprocessEnabled && postprocess.Render()
    }
    return !0
  }

  function ChangeTurret(a, b) {
    var c = "locator_turret_" + a;
    for (var d = 0; d < ship.turretSets.length; ++d) if (ship.turretSets[d].locatorName == c) {
      ship.turretSets.splice(d, 1);
      break
    }
    ship.RebuildTurretPositions(), resMan.GetObject(b.model, undefined, function (a) {
      a.locatorName = c, ApplyColorScheme(a), ship.turretSets.push(a), ship.RebuildTurretPositions()
    })
  }

  function UpdateTurrets() {
    var slots = new Object;
    for (var i = 0; i < ship.locators.length; ++i) {
      var match = /^locator_turret_([0-9]+)[a-z]$/i.exec(ship.locators[i].name);
      if (match) {
        var index = parseInt(match[1]);
        slots[index] = !0
      }
    }
    if (ref.selectedShip.turrets != null) for (slot in slots) {
      var turret = eval(ref.selectedShip.turrets[slot]);
      turret != undefined && ChangeTurret(slot, turret)
    }
  }

  function ApplyColorScheme(a) {
    if (shipColorScheme && a.turretEffect && a.turretEffect.name != "not_overridable") {
      var b = resMan.GetObjectNoInitialize(shipColorSchemePath);
      for (param in b.parameters) if (typeof b.parameters[param].resourcePath == "undefined") {
        if (a.turretEffect.name == "half_overridable" && param == "GlowColor") continue;
        a.turretEffect.parameters[param] = b.parameters[param]
      }
      a.turretEffect.BindParameters()
    }
  }

  function SelectShip(shipName) {
    if (!loadingShip) {
      if (shipName == undefined || shipName == "") {
        alert("CCP ShipViewer: Shipname not specified."), ref.selectedShip = null;
        return
      }
      shipName = shipName.replace("%20", "").replace(" ", "").replace("-", "").toLowerCase(), ref.postprocess = !1, ref.selectedShip = eval("CCPShipResourceList." + shipName);
      if (ref.selectedShip == undefined) {
        alert("CCP ShipViewer: Ship '" + shipName + "' does not exist.");
        return
      }
      ref.selectedShipFact = eval("CCPShipFactList." + shipName);
      var factShipName = ref.selectedShipFact.name;
      loadingShip = !0;
      var loadingBar = document.createElement("div");
      loadingBar.id = "Loading_" + ref.containerId, loadingBar.className = "CCPShipViewerLoading", loadingBar.innerHTML = "Loading Ship " + factShipName, ref.container.appendChild(loadingBar), ref.container.insertBefore(loadingBar, ref.container.childNodes[0]), loadingBar = null, window.setTimeout(function () {
        settings.beforeShipChanged && settings.beforeShipChanged(ref.selectedShipFact);
        if (ref.isWebGL) {
          resMan.Clear(), ship = null, scene.objects = [];
          if (settings.showCubemap == undefined || settings.showCubemap != !1) ref.showOverlay == !0 ? scene.sky = resMan.GetObject("res:/skyboxoverlay.red", "EveSkybox") : scene.sky = resMan.GetObject("res:/skybox.red", "EveSkybox");
          shipBooster = ref.selectedShip.booster;
          if (ref.selectedShip.model.length == 1) ship = resMan.GetObject(ref.selectedShip.model[0], "EveShip"), scene.objects[0] = ship;
          else {
            shipAssembled = !1;
            for (var i = 0; i < ref.selectedShip.model.length; ++i) scene.objects[i] = resMan.GetObject(ref.selectedShip.model[i], "EveShip");
            ship = scene.objects[ref.selectedShip.model.length - 1]
          }
          minZoomDistance = -1, scene.SetEnvMapPath(0, eval(ref.selectedShip.nebula)[0]), scene.SetEnvMapPath(1, eval(ref.selectedShip.nebula)[1])
        } else {
          var fallbackImage = document.createElement("img");
          fallbackImage.id = "fallbackImage", fallbackImage.alt = ref.selectedShipFact.name, fallbackImage.src = ref.assetsPath + "fallback/" + shipName + ".jpg", fallbackImage.style.width = ref.width + "px", fallbackImage.style.height = ref.height + "px", ref.onFallbackImageLoaded(fallbackImage)
        }
      }, 10)
    }
  }

  function TestCamera(a) {
    this.distance = 1, this.currDistance = 1, this.minDistance = -1, this.fov = 60, this.rotationX = -0.4, this.rotationY = 0, this._dragX = 0, this._dragY = 0, this._lastRotationX = 0, this._lastRotationY = 0, this._rotationSpeedX = 0, this._rotationSpeedY = 0, this._measureRotation = null, this._moveEvent = null, this._upEvent = null;
    var b = this,
      c = navigator.userAgent;
    c.indexOf("Chrome") == -1 && c.indexOf("Safari") == -1 ? (ref.container.addEventListener("DOMMouseScroll", function (c) {
      return b.handleWheel(c, a)
    }, !1), ref.container.addEventListener("mousewheel", function (c) {
      return b.handleWheel(c, a)
    }, !1)) : ref.container.addEventListener("mousewheel", function (c) {
      return b.onDocumentMouseWheel(c, a)
    }, !1)
  }
  var settings = options || {};
  if (!settings.parentElementId) alert("CCP Shipviewer: You must specify the parentElementId parameter. This should be an id of the element on your page which holds the shipviewer.");
  else {
    if (!settings.defaultShip) {
      alert("CCP Shipviewer: You must specify the defaultShip parameter. The defaultShip parameter specifies the name of the ship you want to display.");
      return
    }
    var nebulaList = {
      amarr: ["res:/texture/cubemap/amarr/a04_cube.cube", "res:/texture/cubemap/amarr/a04_cube_blur.cube"],
      caldari: ["res:/texture/cubemap/caldari/c16_cube.cube", "res:/texture/cubemap/caldari/c16_cube_blur.cube"],
      gallente: ["res:/texture/cubemap/gallente/g04_cube.cube", "res:/texture/cubemap/gallente/g04_cube_blur.cube"],
      minmatar: ["res:/texture/cubemap/minmatar/m01_cube.cube", "res:/texture/cubemap/minmatar/m01_cube_blur.cube"]
    }, turretList = {
      dualgigabeamlaseri: {
        name: "Dual Giga Beam Laser I",
        model: "res:/dx9/model/turret/energy/beam/xl/beam_gigadual_t1.red",
        colorScheme: "res:/dx9/model/turret/shaderpreset/turretpreset_amarr_t1.red"
      }
    }, ref = this,
      PI = Math.PI,
      container = document.getElementById(settings.parentElementId);
    ShipViewerWaitingList = ShipViewerWaitingList || [], ref.assetsPath = settings.assetsPath || "", ref.height = settings.height || 250, ref.width = settings.width || ref.container.clientWidth || 237, ref.cubeMap = settings.cubeMap || "res:/Texture/fitting_cubesss.cube", ref.overlayPath = settings.overlayPath, ref.pendingResources = 0, ref.shipResourceFileName = "shipresources.js", ref.shipFactsFileName = "shipfacts.js", ref.isWebGL = checkWebGLSupport(), ref.postprocessEnabled = !1, ref.selectedShip = null, ref.overlayPath != undefined ? ref.showOverlay = !0 : ref.showOverlay = !1, ref.postprocessEnabled = !ref.showOverlay;
    var postprocess = null;
    this.containerId = settings.parentElementId, this.theta = 45, this.onMouseDownTheta = 45, this.phi = 60, this.onMouseDownPhi = 60, this.isMouseDown = !1, this.phiDiff = 0, this.thetaDiff = 0;
    var loadingShip = !1,
      device = null,
      shipAssembled = !1,
      defaultShip = settings.defaultShip || "",
      quality = settings.quality || 0,
      boosterGain = settings.boosterGain || .3,
      showFPS = settings.showFPS || !1,
      pitchWave = 0,
      pitchSmallWave = 0,
      rollWave = 0,
      rollSmallWave = 0,
      doAnimation = !0,
      onMouseDownPosition = [0, 0],
      ship = null,
      boosters = null,
      scene = null,
      camera = null,
      shipColorScheme = null,
      shipColorSchemePath = null,
      prevTime = 0,
      minZoomDistance = -1,
      shipBooster = "",
      restorePosition, restoreLeft, restoreTop, restoreWidth, restoreHeight, restoreIndex;
    if (ref.isWebGL) {
      function Tw2ObjectReader(a) {
        this.xmlNode = a
      }
      Tw2ObjectReader.prototype.Construct = function (a) {
        this._inputStack = [], this._inputStack.push([this.xmlNode.documentElement, this, "result"]), this._initializeObjects = [];
        var b = this;
        return function () {
          return b.ConstructFromNode(a, !0)
        }
      }, Tw2ObjectReader.prototype.ConstructAsync = function (a) {
        this._inputStack = [], this._inputStack.push([this.xmlNode.documentElement, this, "result"]);
        while (!this.ConstructFromNode(a, !1));
        return this.result
      }, Tw2ObjectReader.prototype.ConstructFromNode = function (initialize, async) {
        var now = new Date,
          startTime = now.getTime();
        while (this._inputStack.length) {
          var endTime = now.getTime();
          if (async && resMan.prepareBudget < (endTime - startTime) * .001) return !1;
          var inputData = this._inputStack.shift(),
            xmlNode = inputData[0],
            parent = inputData[1],
            index = inputData[2];
          if (xmlNode == null) {
            initialize && typeof parent.Initialize != "undefined" && this._initializeObjects.push(parent);
            continue
          }
          var type = xmlNode.attributes.getNamedItem("type");
          if (type) {
            var object = null;
            if (type.value == "dict") object = new Object;
            else try {
              object = eval("new " + type.value + "()")
            } catch (e) {
              return
            }
            for (var i = 0; i < xmlNode.childNodes.length; ++i) {
              var child = xmlNode.childNodes[i];
              if (child.nodeName == "#text") continue;
              if (type.value != "dict" && typeof object[child.nodeName] == "undefined") {
                log.LogWarn('YAML: object "' + type.value + '" does not have property "' + child.nodeName + '"');
                continue
              }
              this._inputStack.push([child, object, child.nodeName])
            }
            this._inputStack.push([null, object, null]), parent[index] = object;
            continue
          }
          var list = xmlNode.attributes.getNamedItem("list");
          if (list) {
            object = [];
            var arrayIndex = 0;
            for (var i = 0; i < xmlNode.childNodes.length; ++i) {
              var child = xmlNode.childNodes[i];
              if (child.nodeName == "#text") continue;
              this._inputStack.push([child, object, arrayIndex++])
            }
            this._inputStack.push([null, object, null]), parent[index] = object;
            continue
          }
          var value = "";
          for (var i = 0; i < xmlNode.childNodes.length; ++i) {
            var child = xmlNode.childNodes[i];
            child.nodeName == "#text" && (value += child.data)
          }
          var json = xmlNode.attributes.getNamedItem("json");
          if (json) {
            try {
              parent[index] = eval(value)
            } catch (e) {}
            continue
          }
          var capture = /^(\-?\d+\.\d+(?:e|E\-?\d+)?)/.exec(value);
          if (capture) {
            parent[index] = parseFloat(capture[1]);
            continue
          }
          capture = /^(\-?\d+)/.exec(value);
          if (capture) {
            parent[index] = parseInt(capture[1]);
            continue
          }
          capture = /^\b(enabled|true|yes|on)\b/.exec(value);
          if (capture) {
            parent[index] = !0;
            continue
          }
          capture = /^\b(disabled|false|no|off)\b/.exec(value);
          if (capture) {
            parent[index] = !1;
            continue
          }
          parent[index] = value
        }
        while (this._initializeObjects.length) {
          var endTime = now.getTime();
          if (async && resMan.prepareBudget < (endTime - startTime) * .001) return !1;
          var object = this._initializeObjects.pop();
          object.Initialize()
        }
        return !0
      };

      function Tw2Log() {
        this._Log = function (a, b) {
          return
        }, this.Log = function (a) {
          this._Log("Info", a)
        }, this.LogWarn = function (a) {
          this._Log("Warning", a)
        }, this.LogErr = function (a) {
          this._Log("Error", a)
        }
      }
      log = new Tw2Log;

      function Tw2Resource() {
        ref.pendingResources++, this.path = "", this._isLoading = !1, this._isGood = !1, this._notifications = []
      }
      Tw2Resource.prototype.IsLoading = function () {
        return this._isLoading
      }, Tw2Resource.prototype.IsGood = function () {
        return this._isGood
      }, Tw2Resource.prototype.LoadStarted = function () {
        this._isLoading = !0;
        for (var a = 0; a < this._notifications.length; ++a) this._notifications[a].ReleaseCachedData(this)
      }, Tw2Resource.prototype.LoadFinished = function (a) {
        this._isLoading = !1, a || (this._isGood = !1)
      }, Tw2Resource.prototype.PrepareFinished = function (a) {
        ref.pendingResources--, this._isLoading = !1, this._isGood = a;
        for (var b = 0; b < this._notifications.length; ++b) this._notifications[b].RebuildCachedData(this)
      }, Tw2Resource.prototype.SetIsGood = function (a) {
        this._isGood = a
      }, Tw2Resource.prototype.RegisterNotification = function (a) {
        for (var b = 0; b < this._notifications.length; ++b) if (this._notifications[b] == a) return;
        this._notifications[this._notifications.length] = a, this._isGood && a.RebuildCachedData(this)
      }, Tw2Resource.prototype.UnregisterNotification = function (a) {
        for (var b = 0; b < this._notifications.length; ++b) if (this._notifications[b] == a) {
          this._notifications.splice(b, 1);
          return
        }
      };

      function Inherit(a, b) {
        for (i in b.prototype) i in a.prototype || (a.prototype[i] = b.prototype[i]);
        a.prototype._super = b.prototype
      }

      function Tw2VariableStore() {
        this._variables = new Object
      }
      Tw2VariableStore.prototype.RegisterVariableWithType = function (a, b, c) {
        return this._variables[a] = new c(a, b)
      }, Tw2VariableStore.prototype.RegisterType = function (a, b) {
        return this._variables[a] = new b(a)
      }, Tw2VariableStore.prototype.RegisterVariable = function (a, b) {
        if (b.constructor == (new glMatrixArrayType).constructor) {
          if (b.length == 16) return this.RegisterVariableWithType(a, b, Tw2MatrixParameter);
          if (b.length == 4) return this.RegisterVariableWithType(a, b, Tw2Vector4Parameter);
          if (b.length == 3) return this.RegisterVariableWithType(a, b, Tw2Vector3Parameter);
          if (b.length == 2) return this.RegisterVariableWithType(a, b, Tw2Vector2Parameter)
        } else if (typeof b == "string") return this.RegisterVariableWithType(a, b, Tw2TextureParameter)
      };
      var variableStore = new Tw2VariableStore;

      function Tw2MotherLode() {
        this._loadedObjects = new Object, this.Find = function (a) {
          return a in this._loadedObjects ? this._loadedObjects[a] : null
        }, this.Add = function (a, b) {
          this._loadedObjects[a] = b
        }, this.Clear = function () {
          this._loadedObjects = new Object
        }
      }

      function Tw2LoadingObject() {
        this._super.constructor.call(this), this.object = null, this._redContents = null, this._objects = []
      }
      Tw2LoadingObject.prototype.AddObject = function (a, b, c) {
        if (this.IsGood()) {
          this.CreateObject(a, c, b);
          return !1
        }
        a._objectLoading = !0, a._loadCallback = b, typeof c != "undefined" && !c && (a._noInitialization = !0), this._objects[this._objects.length] = a;
        return !1
      }, Tw2LoadingObject.prototype.CreateObject = function (a, b, c) {
        function d(a, b, c, d) {
          var e = new Tw2ObjectReader(a._redContents),
            f = null;
          return function () {
            f == null && (f = e.Construct(c));
            while (!f()) return !0;
            f = null;
            var g = e.result;
            for (var h in g) b[h] = g[h];
            b._objectLoaded = !0, delete b._objectLoading, typeof d != "undefined" && d(b), log.Log("Prepared " + a.path), a.PrepareFinished(!0);
            return !1
          }
        }
        a._objectLoading = !0, device.Schedule(d(this, a, b, c))
      }, Tw2LoadingObject.prototype.Prepare = function (a, b) {
        typeof this._inPrepare == "undefined" && (this._redContents = b, log.Log("Preparing " + this.path), this._constructor = new Tw2ObjectReader(this._redContents), this._constructorFunction = null, this._inPrepare = 0);
        while (this._inPrepare < this._objects.length) {
          if (this._constructorFunction == null) {
            var c = !0;
            typeof this._objects[this._inPrepare]._noInitialization != "undefined" && (c = !1), delete this._objects[this._inPrepare]._noInitialization, this._constructorFunction = this._constructor.Construct(c)
          }
          while (!this._constructorFunction()) return !0;
          this._constructorFunction = null;
          var d = this._constructor.result;
          for (var e in d) this._objects[this._inPrepare][e] = d[e];
          this._objects[this._inPrepare]._objectLoaded = !0, delete this._objects[this._inPrepare]._objectLoading, typeof this._objects[this._inPrepare]._loadCallback != "undefined" && this._objects[this._inPrepare]._loadCallback(this._objects[this._inPrepare]), this._inPrepare++
        }
        log.Log("Prepared " + this.path), delete this._inPrepare, delete this._constructorFunction, delete this._constructor, this.PrepareFinished(!0)
      }, Inherit(Tw2LoadingObject, Tw2Resource);

      function Tw2ResMan() {
        function _DoLoadResource(a, b) {
          return function () {
            readyState = 0;
            try {
              readyState = a.readyState
            } catch (c) {
              log.LogErr('ResMan: communication error when loading  "' + b.path + '" (readyState ' + readyState + ")"), b.LoadFinished(!1);
              return
            }
            if (readyState === 4) if (a.status === 200) {
              b.LoadFinished(!0);
              var d = null,
                e = null;
              try {
                d = a.responseText, e = a.responseXML
              } catch (c) {
                d = a.response
              }
              resMan._prepareQueue.push([b, d, e])
            } else log.LogErr('ResMan: communication error when loading  "' + b.path + '" (code ' + a.status + ")"), b.LoadFinished(!1)
          }
        }

        function PrepareLoop() {
          resMan.prepareBudget = resMan.maxPrepareTime;
          var a = new Date,
            b = a.getTime();
          resMan._prepareQueue.length && log.Log("Prepare frame " + resMan._prepareQueue.length);
          var c = 0;
          while (resMan._prepareQueue.length) {
            resMan._prepareQueue[0][0].Prepare(resMan._prepareQueue[0][1], resMan._prepareQueue[0][2]) || (resMan._prepareQueue.shift(), c++);
            var a = new Date;
            resMan.prepareBudget -= (a.getTime() - b) * .001;
            if (resMan.prepareBudget < 0) break
          }
          c && log.Log("Prepared  " + c + " in " + (resMan.maxPrepareTime - resMan.prepareBudget) + " sec");
          return !0
        }

        function _GetPathExt(a) {
          if (a.substr(0, 5) == "str:/") {
            var b = a.indexOf("/", 5);
            return b == -1 ? null : a.substr(5, b - 5)
          }
          var c = a.lastIndexOf(".");
          return c == -1 ? null : a.substr(c + 1)
        }

        function _NormalizePath(a) {
          if (a.substr(0, 5) == "str:/") return a;
          a = a.toLowerCase(), a.replace("\\", "/");
          return a
        }
        this._extensions = new Object, this.motherLode = new Tw2MotherLode, this.maxPrepareTime = .05, this.prepareBudget = 0, this._prepareQueue = [], this.RegisterExtension = function (a, b) {
          this._extensions[a] = b
        }, this._CreateHttpRequest = function () {
          var a = null;
          if (window.XMLHttpRequest) a = new XMLHttpRequest;
          else if (window.ActiveXObject) try {
            a = new ActiveXObject("Msxml2.XMLHTTP")
          } catch (b) {
            try {
              a = new ActiveXObject("Microsoft.XMLHTTP")
            } catch (b) {}
          }
          a || log.LogErr("ResMan: could not create an XMLHTTP instance");
          return a
        }, this.LogPathString = function (a) {
          return a.substr(0, 5) == "str:/" && a.length > 64 ? a.substr(0, 64) + "..." : a
        }, this.BuildUrl = function (a) {
          return a == "overlaypath.png" ? ref.overlayPath : a.substr(0, 5) != "res:/" ? a : ref.assetsPath + a.substr(5)
        }, this.GetResource = function (a, b) {
          a = _NormalizePath(a);
          if (!b) {
            d = this.motherLode.Find(a);
            if (d !== null) return d
          }
          var c = _GetPathExt(a);
          if (c == null) {
            log.LogErr("ResMan: unknown extension for path " + this.LogPathString(a));
            return null
          }
          if (c in this._extensions) {
            log.Log('ResMan: loading "' + this.LogPathString(a) + '"');
            var d = new this._extensions[c];
            d.path = a, b || this.motherLode.Add(a, d);
            if ("DoCustomLoad" in d) d.DoCustomLoad(a);
            else if (a.substr(0, 5) == "str:/") {
              d.LoadStarted(), d.LoadFinished(!0);
              var e = a.substr(a.indexOf("/", 5) + 1),
                f = null;
              if (window.DOMParser) {
                var g = new DOMParser;
                f = g.parseFromString(e, "text/xml")
              } else f = new ActiveXObject("Microsoft.XMLDOM"), f.async = "false", f.loadXML(e);
              d.Prepare(e, f)
            } else {
              var h = this._CreateHttpRequest();
              h.onreadystatechange = _DoLoadResource(h, d), log.Log('ResMan: requesting "' + this.BuildUrl(a) + '"'), h.open("GET", this.BuildUrl(a)), d.constructor.prototype && d.constructor.prototype.requestResponseType && (h.responseType = d.constructor.prototype.requestResponseType), d.LoadStarted();
              try {
                h.send()
              } catch (i) {
                log.LogErr("ResMan: error sending resource HTTP request: " + i.toString())
              }
            }
            return d
          }
          log.LogErr("ResMan: unregistered extension  " + c);
          return null
        }, this.GetObject = function (a, b, c) {
          return this._GetObject(a, b, c, !0)
        }, this.GetObjectNoInitialize = function (a, b, c) {
          return this._GetObject(a, b, c, !1)
        }, this._GetObject = function (path, type, callback, initialize) {
          path = _NormalizePath(path);
          var obj = null;
          typeof type != "undefined" ? obj = eval("new " + type + "()") : obj = new Object;
          var res = this.motherLode.Find(path);
          if (res !== null) {
            res.AddObject(obj, callback, initialize);
            return obj
          }
          res = new Tw2LoadingObject, res.path = path, res.AddObject(obj, callback, initialize), this.motherLode.Add(path, res);
          if (path.substr(0, 5) == "str:/") {
            obj.LoadStarted(), obj._objectLoaded = !1, obj.LoadFinished(!0);
            var contents = path.substr(path.indexOf("/", 5) + 1),
              xmlDoc = null;
            if (window.DOMParser) {
              var parser = new DOMParser;
              xmlDoc = parser.parseFromString(contents, "text/xml")
            } else xmlDoc = new ActiveXObject("Microsoft.XMLDOM"), xmlDoc.async = "false", xmlDoc.loadXML(contents);
            obj.Prepare(contents, xmlDoc)
          } else {
            var httpRequest = this._CreateHttpRequest();
            httpRequest.onreadystatechange = _DoLoadResource(httpRequest, res), log.Log('ResMan: requesting "' + this.BuildUrl(path) + '"'), httpRequest.open("GET", this.BuildUrl(path)), res.LoadStarted(), obj._objectLoaded = !1;
            try {
              httpRequest.send()
            } catch (e) {
              log.LogErr("ResMan: error sending object HTTP request: " + e.toString())
            }
          }
          return obj
        }, this.Clear = function () {
          this.motherLode.Clear()
        }, this.Start = function () {
          device.Schedule(PrepareLoop)
        }
      }
      var resMan = new Tw2ResMan;

      function Tw2FloatParameter(a, b) {
        typeof a != "undefined" ? this.name = a : this.name = "", typeof b != "undefined" ? this.value = b : this.value = 1
      }
      Tw2FloatParameter.prototype.Apply = function (a, b) {
        device.gl.uniform1f(b, this.value)
      };

      function Tw2GeometryBinaryMesh() {
        this.name = "", this.declaration = new Tw2VertexDeclaration, this.areas = [], this.buffer = null, this.bufferData = null, this.indexes = null, this.minBounds = vec3.create(), this.maxBounds = vec3.create(), this.boundsSpherePosition = vec3.create(), this.boundsSphereRadius = 0, this.bones = []
      }

      function Tw2GeometryBinRes() {
        this._super.constructor.call(this), this.meshes = [], this.minBounds = vec3.create(), this.maxBounds = vec3.create(), this.boundsSpherePosition = vec3.create(), this.boundsSphereRadius = 0, this.models = [], this.animations = []
      }

      function boundsIncludePoint(a, b, c) {
        a[0] > c[0] && (a[0] = c[0]), a[1] > c[1] && (a[1] = c[1]), a[2] > c[2] && (a[2] = c[2]), b[0] < c[0] && (b[0] = c[0]), b[1] < c[1] && (b[1] = c[1]), b[2] < c[2] && (b[2] = c[2])
      }
      Tw2GeometryBinRes.prototype.requestResponseType = "arraybuffer", Tw2GeometryBinRes.prototype.Prepare = function (a) {
        function B() {
          var a = b.ReadUInt8();
          if (a == 0) return null;
          var c = b.ReadUInt8(),
            d = new Tw2GeometryCurve;
          d.dimension = c, d.degree = b.ReadUInt8();
          var e = b.ReadUInt32();
          d.knots = new Float32Array(e);
          for (var f = 0; f < e; ++f) d.knots[f] = b.ReadFloat32();
          var g = b.ReadUInt32();
          d.controls = new Float32Array(g);
          for (var f = 0; f < g; ++f) d.controls[f] = b.ReadFloat32();
          return d
        }

        function e() {
          if (b.ReadIndexBuffer) return b.ReadIndexBuffer();
          var a = b.ReadUInt8(),
            c = b.ReadUInt32();
          if (a == 0) {
            var d = new Uint16Array(c);
            for (var e = 0; e < c; ++e) d[e] = b.ReadUInt16();
            return d
          }
          var d = new Uint32Array(c);
          for (var e = 0; e < c; ++e) d[e] = b.ReadUInt32();
          return d
        }

        function d(a) {
          var d = b.ReadUInt8(),
            e = 0;
          for (var f = 0; f < d; ++f) {
            var g = new Tw2VertexElement;
            g.usage = b.ReadUInt8(), g.usageIndex = b.ReadUInt8(), g.fileType = b.ReadUInt8(), g.type = g.fileType >> 5, g.offset = e, a.elements[f] = g, e += g.type + 1
          }
          a.stride = e;
          if (b.ReadVertexBuffer) return b.ReadVertexBuffer(a);
          var h = b.ReadUInt32();
          if (h == 0) return null;
          var i = new Float32Array(e * h),
            j = 0;
          for (var k = 0; k < h; ++k) for (var f = 0; f < d; ++f) switch (a.elements[f].fileType & 15) {
            case 0:
              if (a.elements[f].fileType & 16) for (var l = 0; l <= a.elements[f].type; ++l) i[j++] = b.ReadInt8() / 127;
              else for (var l = 0; l <= a.elements[f].type; ++l) i[j++] = b.ReadInt8();
              break;
            case 1:
              if (a.elements[f].fileType & 16) for (var l = 0; l <= a.elements[f].type; ++l) i[j++] = b.ReadInt8() / 32767;
              else for (var l = 0; l <= a.elements[f].type; ++l) i[j++] = b.ReadInt16();
              break;
            case 2:
              for (var l = 0; l <= a.elements[f].type; ++l) i[j++] = b.ReadInt32();
              break;
            case 3:
              for (var l = 0; l <= a.elements[f].type; ++l) i[j++] = b.ReadFloat16();
              break;
            case 4:
              for (var l = 0; l <= a.elements[f].type; ++l) i[j++] = b.ReadFloat32();
              break;
            case 8:
              if (a.elements[f].fileType & 16) for (var l = 0; l <= a.elements[f].type; ++l) i[j++] = b.ReadUInt8() / 255;
              else for (var l = 0; l <= a.elements[f].type; ++l) i[j++] = b.ReadUInt8();
              break;
            case 9:
              if (a.elements[f].fileType & 16) for (var l = 0; l <= a.elements[f].type; ++l) i[j++] = b.ReadUInt8() / 65535;
              else for (var l = 0; l <= a.elements[f].type; ++l) i[j++] = b.ReadUInt16();
              break;
            case 10:
              for (var l = 0; l <= a.elements[f].type; ++l) i[j++] = b.ReadUInt32();
              break;
            default:
              log.LogErr("Error loading wbg data " + c.path);
              throw 1
          }
          return i
        }
        var b = new Tw2BinaryReader(new Uint8Array(a)),
          c = this,
          f = b.ReadUInt8(),
          g = b.ReadUInt8();
        for (var h = 0; h < g; ++h) {
          var i = new Tw2GeometryBinaryMesh;
          i.name = b.ReadString();
          var j = d(i.declaration);
          i.buffer = device.gl.createBuffer(), device.gl.bindBuffer(device.gl.ARRAY_BUFFER, i.buffer), device.gl.bufferData(device.gl.ARRAY_BUFFER, j, device.gl.STATIC_DRAW);
          var k = e();
          i.indexes = device.gl.createBuffer(), device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, i.indexes), device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, k, device.gl.STATIC_DRAW);
          var l = b.ReadUInt8();
          for (var m = 0; m < l; ++m) i.areas[m] = new Tw2GeometryMeshArea, i.areas[m].name = b.ReadString(), i.areas[m].start = b.ReadUInt32(), i.areas[m].count = b.ReadUInt32(), i.areas[m].minBounds = vec3.create([b.ReadFloat32(), b.ReadFloat32(), b.ReadFloat32()]), i.areas[m].maxBounds = vec3.create([b.ReadFloat32(), b.ReadFloat32(), b.ReadFloat32()]);
          var n = b.ReadUInt8();
          i.boneBindings = [];
          for (var m = 0; m < n; ++m) i.boneBindings[m] = b.ReadString();
          var o = b.ReadUInt16();
          if (o) {
            i.bufferData = j, i.blendShapes = [];
            for (var m = 0; m < o; ++m) i.blendShapes[m] = new Tw2BlendShapeData, i.blendShapes[m].name = b.ReadString(), i.blendShapes[m].buffer = d(i.blendShapes[m].declaration), i.blendShapes[m].indexes = e()
          }
          this.meshes[h] = i
        }
        var p = b.ReadUInt8();
        for (var q = 0; q < p; ++q) {
          var r = new Tw2GeometryModel;
          r.name = b.ReadString(), r.skeleton = new Tw2GeometrySkeleton;
          var s = b.ReadUInt8();
          for (var t = 0; t < s; ++t) {
            var u = new Tw2GeometryBone;
            u.name = b.ReadString();
            var v = b.ReadUInt8();
            u.parentIndex = b.ReadUInt8(), u.parentIndex == 255 && (u.parentIndex = -1), v & 1 ? vec3.set([b.ReadFloat32(), b.ReadFloat32(), b.ReadFloat32()], u.position) : vec3.set([0, 0, 0], u.position), v & 2 ? quat4.set([b.ReadFloat32(), b.ReadFloat32(), b.ReadFloat32(), b.ReadFloat32()], u.orientation) : quat4.set([0, 0, 0, 1], u.orientation);
            if (v & 4) for (var w = 0; w < 9; ++w) u.scaleShear[w] = b.ReadFloat32();
            else mat3.identity(u.scaleShear);
            r.skeleton.bones[t] = u
          }
          for (var t = 0; t < r.skeleton.bones.length; ++t) r.skeleton.bones[t].UpdateTransform(), r.skeleton.bones[t].parentIndex != -1 ? mat4.multiply(r.skeleton.bones[r.skeleton.bones[t].parentIndex].worldTransform, r.skeleton.bones[t].localTransform, r.skeleton.bones[t].worldTransform) : mat4.set(r.skeleton.bones[t].localTransform, r.skeleton.bones[t].worldTransform), mat4.inverse(r.skeleton.bones[t].worldTransform, r.skeleton.bones[t].worldTransformInv);
          var x = b.ReadUInt8();
          for (var t = 0; t < x; ++t) {
            var y = new Tw2GeometryMeshBinding;
            y.mesh = this.meshes[b.ReadUInt8()];
            for (var z = 0; z < y.mesh.boneBindings.length; ++z) {
              var A = y.mesh.boneBindings[z],
                u = r.FindBoneByName(A);
              u == null ? log.LogErr("Tw2GeometryBinRes: mesh '" + y.mesh.name + "' in file '" + this.path + "' has invalid bone name '" + A + "' for model '" + r.name + "'") : y.bones[y.bones.length] = u
            }
            r.meshBindings[r.meshBindings.length] = y
          }
          this.models[this.models.length] = r
        }
        var C = b.ReadUInt8();
        for (var m = 0; m < C; ++m) {
          var D = new Tw2GeometryAnimation;
          D.name = b.ReadString(), D.duration = b.ReadFloat32();
          var E = b.ReadUInt8();
          for (var t = 0; t < E; ++t) {
            var F = new Tw2GeometryTrackGroup;
            F.name = b.ReadString();
            for (var G = 0; G < this.models.length; ++G) if (this.models[G].name == A) {
              F.model = this.models[G];
              break
            }
            var H = b.ReadUInt8();
            for (var w = 0; w < H; ++w) {
              var I = new Tw2GeometryTransformTrack;
              I.name = b.ReadString(), I.orientation = B(), I.position = B(), I.scaleShear = B();
              if (I.orientation) {
                var J = 0,
                  K = 0,
                  L = 0,
                  M = 0;
                for (var N = 0; N < I.orientation.controls.length; N += 4) {
                  var O = I.orientation.controls[N],
                    P = I.orientation.controls[N + 1],
                    Q = I.orientation.controls[N + 2],
                    R = I.orientation.controls[N + 3];
                  J * O + K * P + L * Q + M * R < 0 && (I.orientation.controls[N] = -O, I.orientation.controls[N + 1] = -P, I.orientation.controls[N + 2] = -Q, I.orientation.controls[N + 3] = -R), J = O, K = P, L = Q, M = R
                }
              }
              F.transformTracks[F.transformTracks.length] = I
            }
            D.trackGroups[D.trackGroups.length] = F
          }
          this.animations[this.animations.length] = D
        }
        this.PrepareFinished(!0)
      }, Tw2GeometryBinRes.prototype.RenderAreas = function (a, b, c, d, e) {
        if (!this.IsGood()) return !1;
        var f = d.GetEffectRes();
        if (!f.IsGood()) return !1;
        if (a >= this.meshes.length) return !1;
        var g = d.GetActiveTechnique(),
          h = this.meshes[a];
        for (var i = 0; i < d.GetPassCount(g); ++i) {
          d.ApplyPass(g, i);
          var j = d.GetPassInput(g, i);
          for (var k = 0; k < j.elements.length; ++k) {
            var l = h.declaration.Find(j.elements[k]);
            if (l == -1) {
              log.LogErr("Error binding vertex buffer to effect attribute for usage " + j.elements[k].usage + " and index " + j.elements[k].usageIndex);
              return !1
            }
            device.gl.enableVertexAttribArray(j.elements[k].attribute), device.gl.bindBuffer(device.gl.ARRAY_BUFFER, h.buffer), device.gl.vertexAttribPointer(j.elements[k].attribute, h.declaration.elements[l].type + 1, device.gl.FLOAT, !1, h.declaration.stride * 4, h.declaration.elements[l].offset * 4)
          }
          device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, h.indexes);
          if (typeof e != "undefined") {
            var m = [];
            for (var k = 0; k < c; ++k) k + b < h.areas.length && m.push([device.gl.TRIANGLES, h.areas[k + b].count * 3, device.gl.UNSIGNED_SHORT, h.areas[k + b].start * 2]);
            e(i, m)
          } else for (var k = 0; k < c; ++k) k + b < h.areas.length && device.gl.drawElements(device.gl.TRIANGLES, h.areas[k + b].count * 3, device.gl.UNSIGNED_SHORT, h.areas[k + b].start * 2)
        }
        return !0
      }, Tw2GeometryBinRes.prototype.RenderDebugInfo = function (a) {
        if (!this.IsGood()) return !1;
        for (var b = 0; b < this.models.length; ++b) if (this.models[b].skeleton) for (var c = 0; c < this.models[b].skeleton.bones.length; ++c) {
          var d = this.models[b].skeleton.bones[c];
          if (d.parentIndex >= 0) {
            var e = this.models[b].skeleton.bones[d.parentIndex];
            a.AddLine([d.worldTransform[12], d.worldTransform[13], d.worldTransform[14]], [e.worldTransform[12], e.worldTransform[13], e.worldTransform[14]], [0, .7, 0, 1], [0, .7, 0, 1])
          }
        }
      }, Inherit(Tw2GeometryBinRes, Tw2Resource), resMan.RegisterExtension("wbg", Tw2GeometryBinRes);

      function Tw2Vector2Parameter(a, b) {
        typeof a != "undefined" ? this.name = a : this.name = "", typeof b != "undefined" ? this.value = b : this.value = [1, 1]
      }
      Tw2Vector2Parameter.prototype.Apply = function (a, b) {
        device.gl.uniform2fv(b, this.value)
      };

      function Tw2Vector3Parameter(a, b) {
        typeof a != "undefined" ? this.name = a : this.name = "", typeof b != "undefined" ? this.value = vec3.create(b) : this.value = vec3.create([1, 1, 1])
      }
      Tw2Vector3Parameter.prototype.Apply = function (a, b) {
        device.gl.uniform3fv(b, this.value)
      };

      function Tw2Vector4Parameter(a, b) {
        typeof a != "undefined" ? this.name = a : this.name = "", typeof b != "undefined" ? this.value = b : this.value = [1, 1, 1, 1]
      }
      Tw2Vector4Parameter.prototype.Apply = function (a, b) {
        device.gl.uniform4fv(b, this.value)
      };

      function Tw2VariableParameter(a, b) {
        typeof a != "undefined" ? this.name = a : this.name = "", typeof b != "undefined" ? this.variableName = b : this.variableName = ""
      }
      Tw2VariableParameter.prototype.Apply = function (a, b) {
        typeof variableStore._variables[this.variableName] != "undefined" && variableStore._variables[this.variableName].Apply(a, b)
      };

      function Tw2MatrixParameter(a, b) {
        typeof a != "undefined" ? this.name = a : this.name = "", typeof b != "undefined" ? this.value = b : (this.value = mat4.create(), mat4.identity(this.value))
      }
      Tw2MatrixParameter.prototype.Apply = function (a, b) {
        device.gl.uniformMatrix4fv(b, !1, this.value)
      };

      function Tw2TextureParameter(a, b) {
        typeof a != "undefined" ? this.name = a : this.name = "", this.textureRes = null, this.wrapS = 10497, this.wrapT = 10497, typeof b != "undefined" ? this.resourcePath = b : this.resourcePath = ""
      }
      Tw2TextureParameter.prototype.SetTexturePath = function (a) {
        this.resourcePath = a, this.resourcePath != "" && (this.textureRes = resMan.GetResource(this.resourcePath))
      }, Tw2TextureParameter.prototype.Initialize = function () {
        this.resourcePath != "" && (this.textureRes = resMan.GetResource(this.resourcePath))
      }, Tw2TextureParameter.prototype.Apply = function (a, b) {
        var c = device.ActivateTexture();
        this.textureRes == null || !this.textureRes.IsGood() ? this.textureRes.isCube ? device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, device.GetFallbackCubeMap()) : device.gl.bindTexture(device.gl.TEXTURE_2D, device.GetFallbackTexture()) : this.textureRes.isCube ? (device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, this.textureRes.texture), device.gl.texParameteri(device.gl.TEXTURE_CUBE_MAP, device.gl.TEXTURE_WRAP_S, device.gl.CLAMP_TO_EDGE), device.gl.texParameteri(device.gl.TEXTURE_CUBE_MAP, device.gl.TEXTURE_WRAP_T, device.gl.CLAMP_TO_EDGE)) : (device.gl.bindTexture(device.gl.TEXTURE_2D, this.textureRes.texture), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_WRAP_S, this.wrapS), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_WRAP_T, this.wrapT)), device.gl.uniform1i(b, c)
      };

      function Tw2TransformParameter(a) {
        typeof a != "undefined" ? this.name = a : this.name = "", this.scaling = vec3.create([1, 1, 1]), this.rotationCenter = vec3.create([0, 0, 0]), this.rotation = [0, 0, 0, 1], this.translation = vec3.create([0, 0, 0]), this.worldTransform = mat4.create(), mat4.identity(this.worldTransform)
      }
      Tw2TransformParameter.prototype.Apply = function (a, b) {
        if (b) {
          mat4.identity(this.worldTransform), mat4.scale(this.worldTransform, this.scaling);
          var c = mat4.create();
          mat4.identity(c), mat4.translate(c, this.rotationCenter);
          var d = mat4.create();
          mat4.identity(d), mat4.translate(d, [-this.rotationCenter[0], -this.rotationCenter[1], -this.rotationCenter[2]]);
          var e = mat4.create();
          e[0] = 1 - 2 * this.rotation[1] * this.rotation[1] - 2 * this.rotation[2] * this.rotation[2], e[4] = 2 * this.rotation[0] * this.rotation[1] - 2 * this.rotation[2] * this.rotation[3], e[8] = 2 * this.rotation[0] * this.rotation[2] + 2 * this.rotation[1] * this.rotation[3], e[1] = 2 * this.rotation[0] * this.rotation[1] + 2 * this.rotation[2] * this.rotation[3], e[5] = 1 - 2 * this.rotation[0] * this.rotation[0] - 2 * this.rotation[2] * this.rotation[2], e[9] = 2 * this.rotation[1] * this.rotation[2] - 2 * this.rotation[0] * this.rotation[3], e[2] = 2 * this.rotation[0] * this.rotation[2] - 2 * this.rotation[1] * this.rotation[3], e[6] = 2 * this.rotation[1] * this.rotation[2] + 2 * this.rotation[0] * this.rotation[3], e[10] = 1 - 2 * this.rotation[0] * this.rotation[0] - 2 * this.rotation[1] * this.rotation[1], e[15] = 1, mat4.multiply(this.worldTransform, d), mat4.multiply(this.worldTransform, e), mat4.multiply(this.worldTransform, c), mat4.translate(this.worldTransform, this.translation), device.gl.uniformMatrix4fv(b, !1, this.worldTransform)
        }
      };

      function Tw2Device() {
        this.RM_ANY = -1, this.RM_OPAQUE = 0, this.RM_DECAL = 1, this.RM_TRANSPARENT = 2, this.RM_ADDITIVE = 3, this.RM_DEPTH = 4, this.RM_FULLSCREEN = 5, this.gl = null, this.debugMode = !1, this.mipLevelSkipCount = 0, this._scheduled = [], this._activeTextures = 0, this._quadBuffer = null, this._currentRenderMode = null, this._whiteTexture = null, this._whiteCube = null, this.world = mat4.create(), mat4.identity(this.world), this.worldInverse = mat4.create(), mat4.identity(this.worldInverse), this.view = mat4.create(), mat4.identity(this.view), this.projection = mat4.create(), mat4.identity(this.projection), this.eyePosition = vec3.create(), this.perObjectData = null, variableStore.RegisterVariable("u_World", this.world), variableStore.RegisterVariable("u_WorldInverse", this.worldInverse), variableStore.RegisterType("u_WorldInverseTranspose", Tw2MatrixParameter), variableStore.RegisterVariable("u_View", this.view), variableStore.RegisterType("u_ViewInverseTranspose", Tw2MatrixParameter), variableStore.RegisterVariable("u_Projection", this.projection), variableStore.RegisterType("u_ViewProjection", Tw2MatrixParameter), variableStore.RegisterType("u_ProjectionInverse", Tw2MatrixParameter), variableStore.RegisterType("u_ViewProjectionInverse", Tw2MatrixParameter), variableStore.RegisterType("u_EyePosition", Tw2Vector3Parameter), variableStore.RegisterType("u_Time", Tw2Vector4Parameter), this.startTime = new Date, this.CreateDevice = function (a) {
          this.gl = null;
          try {
            this.gl = a.getContext("webgl"), this.gl.viewportWidth = a.width, this.gl.viewportHeight = a.height
          } catch (b) {
            try {
              this.gl = a.getContext("experimental-webgl"), this.gl.viewportWidth = a.width, this.gl.viewportHeight = a.height
            } catch (b) {}
          }
          this.gl ? this.debugMode && (this.gl = WebGLDebugUtils.makeDebugContext(this.gl)) : log.LogErr("Could not initialise WebGL"), this._activeTextures = 0, this._quadBuffer = this.gl.createBuffer(), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._quadBuffer);
          var c = [1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0];
          this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(c), this.gl.STATIC_DRAW)
        }, this.Schedule = function (a) {
          this._scheduled[this._scheduled.length] = a
        }, this.Tick = function () {
          var a = new Date;
          a = a.getTime();
          var b = (a - this.startTime) * .001;
          variableStore._variables.u_Time.value = [b, 0, 0, 0];
          for (var c = 0; c < this._scheduled.length; ++c) this._scheduled[c]() || (this._scheduled.splice(c, 1), --c)
        }, this.ResetActiveTextures = function () {
          this._activeTextures = 0
        }, this.ActivateTexture = function () {
          this.gl.activeTexture(device.gl.TEXTURE0 + this._activeTextures);
          return this._activeTextures++
        }, this.SetWorld = function (a) {
          mat4.set(a, this.world);
          var b = mat4.create();
          mat4.inverse(this.world, this.worldInverse), variableStore._variables.u_WorldInverse.value.set(this.worldInverse), mat4.transpose(this.worldInverse, b), variableStore._variables.u_WorldInverseTranspose.value.set(b)
        }, this.SetView = function (a) {
          mat4.set(a, this.view);
          var b = mat4.create();
          mat4.inverse(this.view, b), mat4.transpose(b), variableStore._variables.u_ViewInverseTranspose.value.set(b);
          var c = mat4.create();
          mat4.multiply(this.projection, this.view, c), variableStore._variables.u_ViewProjection.value.set(c), mat4.inverse(c), variableStore._variables.u_ViewProjectionInverse.value.set(c);
          var d = mat4.create();
          mat4.inverse(this.view, d), this.eyePosition = vec3.create([0, 0, 0]), mat4.multiplyVec3(d, this.eyePosition), variableStore._variables.u_EyePosition.value.set(this.eyePosition)
        }, this.SetProjection = function (a) {
          mat4.set(a, this.projection);
          var b = mat4.create();
          mat4.multiply(this.projection, this.view, b), variableStore._variables.u_ViewProjection.value.set(b);
          var c = mat4.create();
          mat4.inverse(this.projection, c), variableStore._variables.u_ProjectionInverse.value.set(c)
        }, this.GetEyePosition = function () {
          return this.eyePosition
        }, this.RenderFullScreenQuad = function (a) {
          if ( !! a) {
            var b = a.GetEffectRes();
            if (!b.IsGood()) return;
            var c = a.GetActiveTechnique();
            for (var d = 0; d < a.GetPassCount(c); ++d) {
              a.ApplyPass(c, d);
              var e = a.GetPassInput(c, d);
              device.gl.enableVertexAttribArray(0), device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._quadBuffer), device.gl.vertexAttribPointer(0, 3, device.gl.FLOAT, !1, 0, 0), device.gl.drawArrays(device.gl.TRIANGLE_STRIP, 0, 4)
            }
          }
        }, this.SetStandardStates = function (a) {
          if (this._currentRenderMode != a) {
            this.gl.frontFace(this.gl.CCW);
            switch (a) {
              case this.RM_OPAQUE:
                this.gl.enable(this.gl.DEPTH_TEST), this.gl.enable(this.gl.CULL_FACE), this.gl.disable(this.gl.BLEND), this.gl.depthFunc(this.gl.LEQUAL), this.gl.blendEquationSeparate(this.gl.FUNC_ADD, this.gl.FUNC_ADD), this.gl.blendFuncSeparate(this.gl.ONE, this.gl.ZERO, this.gl.ONE, this.gl.ZERO), this.gl.disable(this.gl.POLYGON_OFFSET_FILL), this.gl.depthMask(!0);
                break;
              case this.RM_TRANSPARENT:
              case this.RM_DECAL:
                this.gl.enable(this.gl.DEPTH_TEST), this.gl.enable(this.gl.CULL_FACE), this.gl.enable(this.gl.BLEND), this.gl.depthMask(!1), this.gl.depthFunc(this.gl.LEQUAL), this.gl.enable(this.gl.POLYGON_OFFSET_FILL), this.gl.polygonOffset(-1, 0), this.gl.blendEquationSeparate(this.gl.FUNC_ADD, this.gl.FUNC_ADD), this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE);
                break;
              case this.RM_ADDITIVE:
                this.gl.enable(this.gl.DEPTH_TEST), this.gl.disable(this.gl.CULL_FACE), this.gl.enable(this.gl.BLEND), this.gl.depthFunc(this.gl.LEQUAL), this.gl.depthMask(!1), this.gl.blendEquation(this.gl.FUNC_ADD), this.gl.disable(this.gl.POLYGON_OFFSET_FILL), this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
                break;
              case this.RM_FULLSCREEN:
                this.gl.disable(this.gl.DEPTH_TEST), this.gl.enable(this.gl.CULL_FACE), this.gl.disable(this.gl.BLEND), this.gl.depthFunc(this.gl.LEQUAL), this.gl.blendEquationSeparate(this.gl.FUNC_ADD, this.gl.FUNC_ADD), this.gl.blendFuncSeparate(this.gl.ONE, this.gl.ZERO, this.gl.ONE, this.gl.ZERO), this.gl.disable(this.gl.POLYGON_OFFSET_FILL), this.gl.depthMask(!0);
                break;
              default:
                return
            }
            this._currentRenderMode = a
          }
        }, this.GetFallbackTexture = function () {
          this._whiteTexture == null && (this._whiteTexture = device.gl.createTexture(), device.gl.bindTexture(device.gl.TEXTURE_2D, this._whiteTexture), device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, 1, 1, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0])), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.LINEAR), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.LINEAR_MIPMAP_LINEAR), device.gl.bindTexture(device.gl.TEXTURE_2D, null));
          return this._whiteTexture
        }, this.GetFallbackCubeMap = function () {
          if (this._whiteCube == null) {
            this._whiteCube = device.gl.createTexture(), device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, this._whiteCube);
            for (var a = 0; a < 6; ++a) device.gl.texImage2D(device.gl.TEXTURE_CUBE_MAP_POSITIVE_X + a, 0, device.gl.RGBA, 1, 1, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
            device.gl.texParameteri(device.gl.TEXTURE_CUBE_MAP, device.gl.TEXTURE_MAG_FILTER, device.gl.LINEAR), device.gl.texParameteri(device.gl.TEXTURE_CUBE_MAP, device.gl.TEXTURE_MIN_FILTER, device.gl.LINEAR_MIPMAP_LINEAR), device.gl.generateMipmap(device.gl.TEXTURE_CUBE_MAP), device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, null)
          }
          return this._whiteCube
        }
      }
      device = new Tw2Device, resMan.Start();

      function Tw2PerObjectData() {
        this._super.constructor.call(this)
      }
      Tw2PerObjectData.prototype.SetPerObjectData = function () {
        typeof this.world != "undefined" ? device.SetWorld(this.world) : device.SetWorld(mat4.identity(mat4.create()))
      }, Tw2PerObjectData.prototype.ApplyShaderParameters = function (a) {
        for (var b in this._variables) this._variables[b].Apply(a, device.gl.getUniformLocation(a, b))
      }, Inherit(Tw2PerObjectData, Tw2VariableStore);

      function Tw2SkinnedPerObjectData(a, b, c) {
        this._variables = new Object, this.perObjectData = typeof c == "undefined" ? null : c, this.worldArray = null, this.worldArray = a;
        return
      }
      Tw2SkinnedPerObjectData.prototype.SetPerObjectData = function () {
        this.perObjectData && this.perObjectData.SetPerObjectData(), typeof this.world != "undefined" ? device.SetWorld(this.world) : device.SetWorld(mat4.identity(mat4.create()))
      }, Tw2SkinnedPerObjectData.prototype.ApplyShaderParameters = function (a) {
        this._super.ApplyShaderParameters.call(this, a), this.perObjectData && this.perObjectData.ApplyShaderParameters(a);
        if (this.worldArray != null) {
          var b = device.gl.getUniformLocation(a, "u_BoneMatrixes");
          device.gl.uniformMatrix4fv(b, !1, this.worldArray)
        }
      }, Inherit(Tw2SkinnedPerObjectData, Tw2PerObjectData);

      function Tw2RenderTarget() {
        this.texture = null, this._frameBuffer = null, this.width = null, this.height = null, this.hasDepth = null
      }
      Tw2RenderTarget.prototype.Destroy = function () {
        this.texture && (device.gl.deleteTexture(this.texture.texture), this.texture = null), this._renderBuffer && (device.gl.deleteRenderbuffer(this._renderBuffer), this._renderBuffer = null), this._frameBuffer && (device.gl.deleteFramebuffer(this._frameBuffer), this._frameBuffer = null)
      }, Tw2RenderTarget.prototype.Create = function (a, b, c) {
        this.Destroy(), this.texture = new Tw2TextureRes, this.texture.Attach(device.gl.createTexture()), this._frameBuffer = device.gl.createFramebuffer(), device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, this._frameBuffer), device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture.texture), device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, a, b, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, null), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.LINEAR), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.LINEAR), device.gl.bindTexture(device.gl.TEXTURE_2D, null), this._renderBuffer = null, c && (this._renderBuffer = device.gl.createRenderbuffer(), device.gl.bindRenderbuffer(device.gl.RENDERBUFFER, this._renderBuffer), device.gl.renderbufferStorage(device.gl.RENDERBUFFER, device.gl.DEPTH_COMPONENT16, a, b)), device.gl.framebufferTexture2D(device.gl.FRAMEBUFFER, device.gl.COLOR_ATTACHMENT0, device.gl.TEXTURE_2D, this.texture.texture, 0), c && device.gl.framebufferRenderbuffer(device.gl.FRAMEBUFFER, device.gl.DEPTH_ATTACHMENT, device.gl.RENDERBUFFER, this._renderBuffer), device.gl.bindRenderbuffer(device.gl.RENDERBUFFER, null), device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, null), this.width = a, this.height = b, this.hasDepth = c
      }, Tw2RenderTarget.prototype.Set = function () {
        this._oldViewport = device.gl.getParameter(device.gl.VIEWPORT), device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, this._frameBuffer), device.gl.viewport(0, 0, this.width, this.height)
      }, Tw2RenderTarget.prototype.Unset = function () {
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, null), device.gl.viewport(this._oldViewport[0], this._oldViewport[1], this._oldViewport[2], this._oldViewport[3])
      };

      function Tw2PostProcess() {
        this.width = 0, this.height = 0, this.texture = null, this.halfRT = new Tw2RenderTarget, this.quadRT0 = new Tw2RenderTarget, this.quadRT1 = new Tw2RenderTarget, this.luminance = new Tw2FloatParameter("Luminance", .06), this.middleGray = new Tw2FloatParameter("MiddleGray", .28), this.whiteCutoff = new Tw2FloatParameter("WhiteCutoff", .8), this.bloomStrength = new Tw2FloatParameter("Strength", 1), this.highpass = new Tw2Effect, this.highpass.effectFilePath = "res:/Graphics/Effect/managed/postprocess/highpass.fx", this.highpass.Initialize(), this.highpass.parameters.texture = new Tw2TextureParameter("texture"), this.highpass.parameters.texture.wrapS = device.gl.CLAMP_TO_EDGE, this.highpass.parameters.texture.wrapT = device.gl.CLAMP_TO_EDGE, this.highpass.parameters.Luminance = this.luminance, this.highpass.parameters.MiddleGray = this.middleGray, this.highpass.parameters.WhiteCutoff = this.whiteCutoff, this.copy = new Tw2Effect, this.copy.effectFilePath = "res:/Graphics/Effect/managed/postprocess/copy.fx", this.copy.Initialize(), this.copy.parameters.texture = new Tw2TextureParameter("texture"), this.copy.parameters.texture.wrapS = device.gl.CLAMP_TO_EDGE, this.copy.parameters.texture.wrapT = device.gl.CLAMP_TO_EDGE, this.copy.parameters.Strength = new Tw2FloatParameter("Strength", 1), this.combine = new Tw2Effect, this.combine.effectFilePath = "res:/Graphics/Effect/managed/postprocess/copy.fx", this.combine.Initialize(), this.combine.parameters.texture = new Tw2TextureParameter("texture"), this.combine.parameters.texture.wrapS = device.gl.CLAMP_TO_EDGE, this.combine.parameters.texture.wrapT = device.gl.CLAMP_TO_EDGE, this.combine.parameters.Strength = this.bloomStrength, this.blur = new Tw2Effect, this.blur.effectFilePath = "res:/Graphics/Effect/managed/postprocess/blur.fx", this.blur.Initialize(), this.blur.parameters.texture = new Tw2TextureParameter("texture"), this.blur.parameters.texture.wrapS = device.gl.CLAMP_TO_EDGE, this.blur.parameters.texture.wrapT = device.gl.CLAMP_TO_EDGE, this.blur.parameters.direction = new Tw2Vector2Parameter("direction")
      }
      Tw2PostProcess.prototype.Render = function () {
        var a = device.gl.viewportWidth,
          b = device.gl.viewportHeight;
        if (!(a <= 0 || b <= 0)) {
          this.texture == null && (this.texture = new Tw2TextureRes, this.texture.Attach(device.gl.createTexture()));
          if (a != this.width || b != this.height) device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture.texture), device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, a, b, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, null), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_WRAP_S, device.gl.CLAMP_TO_EDGE), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_WRAP_T, device.gl.CLAMP_TO_EDGE), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.LINEAR), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.LINEAR), device.gl.bindTexture(device.gl.TEXTURE_2D, null), this.halfRT.Create(a / 2, b / 2, !1), this.quadRT0.Create(a / 4, b / 4, !1), this.quadRT1.Create(a / 4, b / 4, !1), this.width = a, this.height = b;
          device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture.texture), device.gl.copyTexImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, 0, 0, a, b, 0), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_WRAP_S, device.gl.CLAMP_TO_EDGE), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_WRAP_T, device.gl.CLAMP_TO_EDGE), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.LINEAR), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.LINEAR), device.gl.bindTexture(device.gl.TEXTURE_2D, null), device.SetStandardStates(device.RM_OPAQUE), this.halfRT.Set(), this.highpass.parameters.texture.textureRes = this.texture, device.RenderFullScreenQuad(this.highpass), this.quadRT0.Set(), this.copy.parameters.texture.textureRes = this.halfRT.texture, device.RenderFullScreenQuad(this.copy), this.quadRT1.Set(), this.blur.parameters.texture.textureRes = this.quadRT0.texture, this.blur.parameters.direction.value = [0, 4 / b], device.RenderFullScreenQuad(this.blur), this.quadRT0.Set(), this.blur.parameters.texture.textureRes = this.quadRT1.texture, this.blur.parameters.direction.value = [4 / a, 0], device.RenderFullScreenQuad(this.blur), this.halfRT.Unset(), device.SetStandardStates(device.RM_ADDITIVE), this.combine.parameters.texture.textureRes = this.quadRT0.texture, device.RenderFullScreenQuad(this.combine)
        }
      };

      function Tw2BatchAccumulator(a) {
        this.batches = [], this.count = 0, this._sortMethod = a
      }
      Tw2BatchAccumulator.prototype.Commit = function (a) {
        this.batches[this.count++] = a
      }, Tw2BatchAccumulator.prototype.Clear = function () {
        this.count = 0
      }, Tw2BatchAccumulator.prototype.Render = function (a) {
        typeof this._sortMethod != "undefined" && this.batches.sort(this._sortMethod);
        for (var b = 0; b < this.count; ++b) this.batches[b].renderMode != device.RM_ANY && device.SetStandardStates(this.batches[b].renderMode), device.perObjectData = null, this.batches[b].perObjectData && (this.batches[b].perObjectData.SetPerObjectData(), device.perObjectData = this.batches[b].perObjectData), this.batches[b].Commit(a), device.perObjectData = null
      };

      function Tw2RenderBatch() {
        this.renderMode = device.RM_ANY, this.perObjectData = null
      }

      function Tw2ForwardingRenderBatch() {
        this.geometryProvider = null
      }
      Tw2ForwardingRenderBatch.prototype.Commit = function (a) {
        this.geometryProvider && this.geometryProvider.Render(this, a)
      }, Inherit(Tw2ForwardingRenderBatch, Tw2RenderBatch);

      function Tw2BinaryReader(a) {
        this.data = a, this.cursor = 0
      }
      Tw2BinaryReader.prototype.ReadUInt8 = function () {
        return this.data[this.cursor++]
      }, Tw2BinaryReader.prototype.ReadInt8 = function () {
        var a = this.data[this.cursor++];
        a > 127 && (a = a - 255 - 1);
        return a
      }, Tw2BinaryReader.prototype.ReadUInt16 = function () {
        return this.data[this.cursor++] + (this.data[this.cursor++] << 8)
      }, Tw2BinaryReader.prototype.ReadInt16 = function () {
        var a = this.data[this.cursor++] + (this.data[this.cursor++] << 8);
        a > 32767 && (a = a - 65535 - 1);
        return a
      }, Tw2BinaryReader.prototype.ReadUInt32 = function () {
        return this.data[this.cursor++] + (this.data[this.cursor++] << 8) + (this.data[this.cursor++] << 16) + (this.data[this.cursor++] << 24)
      }, Tw2BinaryReader.prototype.ReadInt32 = function () {
        var a = this.data[this.cursor++] + (this.data[this.cursor++] << 8) + (this.data[this.cursor++] << 16) + (this.data[this.cursor++] << 24);
        a > 2147483647 && (a = a - 4294967295 - 1);
        return a
      }, Tw2BinaryReader.prototype.ReadFloat16 = function () {
        var a = this.data[this.cursor++],
          b = this.data[this.cursor++],
          c = 1 - 2 * (b >> 7),
          d = (b >> 2 & 31) - 15,
          e = (b & 3) << 8 | a;
        return e == 0 && d == -15 ? 0 : c * (1 + e * Math.pow(2, -10)) * Math.pow(2, d)
      }, Tw2BinaryReader.prototype.ReadFloat32 = function () {
        var a = this.data[this.cursor++],
          b = this.data[this.cursor++],
          c = this.data[this.cursor++],
          d = this.data[this.cursor++],
          e = 1 - 2 * (d >> 7),
          f = (d << 1 & 255 | c >> 7) - 127,
          g = (c & 127) << 16 | b << 8 | a;
        return g == 0 && f == -127 ? 0 : e * (1 + g * Math.pow(2, -23)) * Math.pow(2, f)
      }, Tw2BinaryReader.prototype.ReadString = function () {
        var a = this.data[this.cursor++],
          b = "";
        for (var c = 0; c < a; ++c) b += String.fromCharCode(this.data[this.cursor++]);
        return b
      };

      function Tw2GeometryBatch() {
        this._super.constructor.call(this), this.geometryRes = null, this.meshIx = 0, this.start = 0, this.count = 1, this.effect = null, this.batchDepth = 0
      }
      Tw2GeometryBatch.prototype.Commit = function (a) {
        var b = typeof a == "undefined" ? this.effect : a;
        this.geometryRes && b && this.geometryRes.RenderAreas(this.meshIx, this.start, this.count, b)
      }, Inherit(Tw2GeometryBatch, Tw2RenderBatch);

      function Tw2GeometryMeshArea() {
        this.name = "", this.start = 0, this.count = 0, this.minBounds = vec3.create(), this.maxBounds = vec3.create(), this.boundsSpherePosition = vec3.create(), this.boundsSphereRadius = 0
      }

      function Tw2GeometryMeshBinding() {
        this.mesh = null, this.bones = []
      }

      function Tw2GeometryModel() {
        this.name = "", this.meshBindings = [], this.skeleton = null
      }
      Tw2GeometryModel.prototype.FindBoneByName = function (a) {
        if (this.skeleton == null) return null;
        for (var b = 0; b < this.skeleton.bones.length; ++b) if (this.skeleton.bones[b].name == a) return this.skeleton.bones[b];
        return null
      };

      function Tw2GeometrySkeleton() {
        this.bones = []
      }

      function Tw2GeometryBone() {
        this.name = "", this.parentIndex = -1, this.position = vec3.create(), this.orientation = quat4.create(), this.scaleShear = mat3.create(), this.localTransform = mat4.create(), this.worldTransform = mat4.create(), this.worldTransformInv = mat4.create()
      }
      Tw2GeometryBone.prototype.UpdateTransform = function () {
        mat3.toMat4(this.scaleShear, this.localTransform), mat4.multiply(this.localTransform, mat4.transpose(quat4.toMat4(quat4.normalize(this.orientation)))), this.localTransform[12] = this.position[0], this.localTransform[13] = this.position[1], this.localTransform[14] = this.position[2];
        return this.localTransform
      };

      function Tw2GeometryAnimation() {
        this.name = "", this.duration = 0, this.trackGroups = []
      }

      function Tw2GeometryTrackGroup() {
        this.name = "", this.model = null, this.transformTracks = []
      }

      function Tw2GeometryTransformTrack() {
        this.name = "", this.position = null, this.orientation = null, this.scaleShear = null
      }

      function Tw2GeometryCurve() {
        this.dimension = 0, this.degree = 0, this.knots = null, this.controls = null
      }

      function Tw2BlendShapeData() {
        this.name = "", this.declaration = new Tw2VertexDeclaration, this.buffers = [], this.indexes = null, this.weightProxy = null
      }

      function Tw2GeometryMesh() {
        this.name = "", this.declaration = new Tw2VertexDeclaration, this.buffers = [], this.bufferData = [], this.areas = [], this.indexes = null, this.minBounds = vec3.create(), this.maxBounds = vec3.create(), this.boundsSpherePosition = vec3.create(), this.boundsSphereRadius = 0, this.bones = []
      }
      Tw2GeometryMesh.prototype.CreateBuffer = function (a, b) {
        var c = this.buffers.length;
        this.buffers[c] = device.gl.createBuffer(), this.bufferData[c] = new Float32Array(b), device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this.buffers[c]), device.gl.bufferData(device.gl.ARRAY_BUFFER, this.bufferData[c], device.gl.STATIC_DRAW), this.buffers[c].itemSize = a.type + 1, this.buffers[c].numItems = b.length / (a.type + 1)
      };

      function Tw2GeometryRes() {
        this._super.constructor.call(this), this.meshes = [], this.minBounds = vec3.create(), this.maxBounds = vec3.create(), this.boundsSpherePosition = vec3.create(), this.boundsSphereRadius = 0, this.models = [], this.animations = []
      }

      function boundsIncludePoint(a, b, c) {
        a[0] > c[0] && (a[0] = c[0]), a[1] > c[1] && (a[1] = c[1]), a[2] > c[2] && (a[2] = c[2]), b[0] < c[0] && (b[0] = c[0]), b[1] < c[1] && (b[1] = c[1]), b[2] < c[2] && (b[2] = c[2])
      }
      Tw2GeometryRes.prototype.Prepare = function (data) {
        try {
          data = eval("([" + data + "])")
        } catch (e) {
          log.LogErr("Error loading gr2 data " + this.path), this.PrepareFinished(!1);
          return
        }
        for (var meshIx = 0; meshIx < data[0].length; ++meshIx) {
          var mesh = new Tw2GeometryMesh;
          mesh.name = data[0][meshIx][0];
          for (var declIx = 0; declIx < data[0][meshIx][1].length; ++declIx) {
            var element = new Tw2VertexElement(data[0][meshIx][1][declIx][0], data[0][meshIx][1][declIx][1], data[0][meshIx][1][declIx][2]);
            mesh.declaration.elements[mesh.declaration.elements.length] = element
          }
          for (var i = 0; i < data[0][meshIx][1].length; ++i) mesh.CreateBuffer(mesh.declaration.elements[i], data[0][meshIx][2][i]);
          mesh.indexes = device.gl.createBuffer(), device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, mesh.indexes), device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data[0][meshIx][3]), device.gl.STATIC_DRAW);
          if (data[0][meshIx].length > 6) {
            var annotations = data[0][meshIx][6];
            mesh.blendShapes = [];
            for (var i = 0; i < annotations.length; ++i) {
              mesh.blendShapes[i] = new Tw2BlendShapeData, mesh.blendShapes[i].name = annotations[i][0];
              if (annotations[i].length > 1) {
                for (var declIx = 0; declIx < annotations[i][1].length; ++declIx) {
                  var element = new Tw2VertexElement(annotations[i][1][declIx][0], annotations[i][1][declIx][1], annotations[i][1][declIx][2]);
                  mesh.blendShapes[i].declaration.elements[declIx] = element, mesh.blendShapes[i].buffers[declIx] = new Float32Array(annotations[i][2][declIx])
                }
                mesh.blendShapes[i].indexes = new Uint16Array(annotations[i][3])
              }
            }
          }
          var positions = mesh.declaration.Find(new Tw2VertexElement(0, 0, 0)),
            positionStride = 3;
          positions != -1 && mesh.declaration.elements[positions].type >= 2 ? (positionStride = mesh.declaration.elements[positions].type + 1, positions = data[0][meshIx][2][positions]) : positions = null, mesh.areas = [];
          for (var i = 0; i < data[0][meshIx][4].length; ++i) mesh.areas[i] = new Tw2GeometryMeshArea, mesh.areas[i].name = data[0][meshIx][4][i][0], mesh.areas[i].start = data[0][meshIx][4][i][1], mesh.areas[i].count = data[0][meshIx][4][i][2], mesh.areas[i].minBounds = vec3.create([data[0][meshIx][4][i][3], data[0][meshIx][4][i][4], data[0][meshIx][4][i][5]]), mesh.areas[i].maxBounds = vec3.create([data[0][meshIx][4][i][6], data[0][meshIx][4][i][7], data[0][meshIx][4][i][8]]), mesh.areas[i].boundsSpherePosition = vec3.create([data[0][meshIx][4][i][9], data[0][meshIx][4][i][10], data[0][meshIx][4][i][11]]), mesh.areas[i].boundsSphereRadius = data[0][meshIx][4][i][12];
          if (mesh.areas.length) {
            vec3.set(mesh.areas[0].minBounds, mesh.minBounds), vec3.set(mesh.areas[0].maxBounds, mesh.maxBounds);
            for (var i = 1; i < mesh.areas.length; ++i) boundsIncludePoint(mesh.minBounds, mesh.maxBounds, mesh.areas[i].minBounds), boundsIncludePoint(mesh.minBounds, mesh.maxBounds, mesh.areas[i].maxBounds);
            vec3.add(mesh.maxBounds, mesh.minBounds, mesh.boundsSpherePosition), mesh.boundsSpherePosition[0] *= .5, mesh.boundsSpherePosition[1] *= .5, mesh.boundsSpherePosition[2] *= .5;
            var size = vec3.create();
            vec3.subtract(mesh.maxBounds, mesh.minBounds, size), mesh.boundsSphereRadius = vec3.length(size)
          }
          this.meshes[this.meshes.length] = mesh
        }
        if (this.meshes.length) {
          vec3.set(this.meshes[0].minBounds, this.minBounds), vec3.set(this.meshes[0].maxBounds, this.maxBounds);
          for (var i = 1; i < this.meshes.length; ++i) boundsIncludePoint(this.minBounds, this.maxBounds, this.meshes[i].minBounds), boundsIncludePoint(this.minBounds, this.maxBounds, this.meshes[i].maxBounds);
          vec3.add(this.maxBounds, this.minBounds, this.boundsSpherePosition), this.boundsSpherePosition[0] *= .5, this.boundsSpherePosition[1] *= .5, this.boundsSpherePosition[2] *= .5;
          var size = vec3.create();
          vec3.subtract(this.maxBounds, this.minBounds, size), this.boundsSphereRadius = vec3.length(size)
        }
        if (data.length > 1) for (var i = 0; i < data[1].length; ++i) {
          var model = new Tw2GeometryModel;
          model.name = data[1][i][0], model.skeleton = new Tw2GeometrySkeleton;
          for (var j = 0; j < data[1][i][1].length; ++j) {
            var bone = new Tw2GeometryBone,
              boneData = data[1][i][1][j];
            bone.name = boneData[0], bone.parentIndex = boneData[1], vec3.set([boneData[2], boneData[3], boneData[4]], bone.position), boneData.length == 9 || boneData.length == 18 ? quat4.set([boneData[5], boneData[6], boneData[7], boneData[8]], bone.orientation) : quat4.set([0, 0, 0, 1], bone.orientation), boneData.length == 14 ? mat3.set(boneData.slice(5), bone.scaleShear) : boneData.length == 18 ? mat3.set(boneData.slice(9), bone.scaleShear) : mat3.identity(bone.scaleShear), model.skeleton.bones[model.skeleton.bones.length] = bone
          }
          for (var j = 0; j < model.skeleton.bones.length; ++j) model.skeleton.bones[j].UpdateTransform(), model.skeleton.bones[j].parentIndex != -1 ? mat4.multiply(model.skeleton.bones[model.skeleton.bones[j].parentIndex].worldTransform, model.skeleton.bones[j].localTransform, model.skeleton.bones[j].worldTransform) : mat4.set(model.skeleton.bones[j].localTransform, model.skeleton.bones[j].worldTransform), mat4.inverse(model.skeleton.bones[j].worldTransform, model.skeleton.bones[j].worldTransformInv);
          if (data[1][i].length > 2) for (var j = 0; j < data[1][i][2].length; ++j) {
            var meshIx = data[1][i][2][j],
              binding = new Tw2GeometryMeshBinding;
            binding.mesh = this.meshes[meshIx];
            if (data[0][meshIx].length > 5) for (var b = 0; b < data[0][meshIx][5].length; ++b) {
              var name = data[0][meshIx][5][b],
                bone = model.FindBoneByName(name);
              bone == null ? log.LogErr("Tw2GeometryRes: mesh '" + this.meshes[meshIx].name + "' in file '" + this.path + "' has invalid bone name '" + name + "' for model '" + model.name + "'") : binding.bones[binding.bones.length] = bone
            }
            model.meshBindings[model.meshBindings.length] = binding
          }
          this.models[this.models.length] = model
        }
        if (data.length > 2) for (var i = 0; i < data[2].length; ++i) {
          var animation = new Tw2GeometryAnimation;
          animation.name = data[2][i][0], animation.duration = data[2][i][1];
          for (var j = 0; j < data[2][i][2].length; ++j) {
            var group = new Tw2GeometryTrackGroup;
            group.name = data[2][i][2][j][0];
            for (var m = 0; m < this.models.length; ++m) if (this.models[m].name == name) {
              group.model = this.models[m];
              break
            }
            for (var k = 0; k < data[2][i][2][j][1].length; ++k) {
              var track = new Tw2GeometryTransformTrack;
              track.name = data[2][i][2][j][1][k][0];

              function ReadCurve(a) {
                if (a == null) return null;
                var b = new Tw2GeometryCurve;
                b.dimension = a[0], b.degree = a[1], b.knots = a[2], b.controls = a[3];
                return b
              }
              track.orientation = ReadCurve(data[2][i][2][j][1][k][1]), track.position = ReadCurve(data[2][i][2][j][1][k][2]), track.scaleShear = ReadCurve(data[2][i][2][j][1][k][3]);
              if (track.orientation) {
                var lastX = 0,
                  lastY = 0,
                  lastZ = 0,
                  lastW = 0;
                for (var n = 0; n < track.orientation.controls.length; n += 4) {
                  var x = track.orientation.controls[n],
                    y = track.orientation.controls[n + 1],
                    z = track.orientation.controls[n + 2],
                    w = track.orientation.controls[n + 3];
                  lastX * x + lastY * y + lastZ * z + lastW * w < 0 && (track.orientation.controls[n] = -x, track.orientation.controls[n + 1] = -y, track.orientation.controls[n + 2] = -z, track.orientation.controls[n + 3] = -w), lastX = x, lastY = y, lastZ = z, lastW = w
                }
              }
              group.transformTracks[group.transformTracks.length] = track
            }
            animation.trackGroups[animation.trackGroups.length] = group
          }
          this.animations[this.animations.length] = animation
        }
        this.PrepareFinished(!0)
      }, Tw2GeometryRes.prototype.RenderAreas = function (a, b, c, d, e) {
        if (!this.IsGood()) return !1;
        var f = d.GetEffectRes();
        if (!f.IsGood()) return !1;
        if (a >= this.meshes.length) return !1;
        var g = d.GetActiveTechnique(),
          h = this.meshes[a];
        for (var i = 0; i < d.GetPassCount(g); ++i) {
          d.ApplyPass(g, i);
          var j = d.GetPassInput(g, i);
          for (var k = 0; k < j.elements.length; ++k) {
            var l = h.declaration.Find(j.elements[k]);
            if (l == -1) {
              log.LogErr("Error binding vertex buffer to effect attribute for usage " + j.elements[k].usage + " and index " + j.elements[k].usageIndex);
              return !1
            }
            device.gl.enableVertexAttribArray(j.elements[k].attribute), device.gl.bindBuffer(device.gl.ARRAY_BUFFER, h.buffers[l]), device.gl.vertexAttribPointer(j.elements[k].attribute, h.declaration.elements[l].type + 1, device.gl.FLOAT, !1, 0, 0)
          }
          device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, h.indexes);
          if (typeof e != "undefined") {
            var m = [];
            for (var k = 0; k < c; ++k) k + b < h.areas.length && m.push([device.gl.TRIANGLES, h.areas[k + b].count * 3, device.gl.UNSIGNED_SHORT, h.areas[k + b].start * 2]);
            e(i, m)
          } else for (var k = 0; k < c; ++k) k + b < h.areas.length && device.gl.drawElements(device.gl.TRIANGLES, h.areas[k + b].count * 3, device.gl.UNSIGNED_SHORT, h.areas[k + b].start * 2)
        }
        return !0
      }, Tw2GeometryRes.prototype.RenderDebugInfo = function (a) {
        if (!this.IsGood()) return !1;
        for (var b = 0; b < this.models.length; ++b) if (this.models[b].skeleton) for (var c = 0; c < this.models[b].skeleton.bones.length; ++c) {
          var d = this.models[b].skeleton.bones[c];
          if (d.parentIndex >= 0) {
            var e = this.models[b].skeleton.bones[d.parentIndex];
            a.AddLine([d.worldTransform[12], d.worldTransform[13], d.worldTransform[14]], [e.worldTransform[12], e.worldTransform[13], e.worldTransform[14]], [0, .7, 0, 1], [0, .7, 0, 1])
          }
        }
      }, Inherit(Tw2GeometryRes, Tw2Resource), resMan.RegisterExtension("gr2", Tw2GeometryRes);

      function Tw2GeometryBatch() {
        this._super.constructor.call(this), this.geometryRes = null, this.meshIx = 0, this.start = 0, this.count = 1, this.effect = null, this.batchDepth = 0
      }
      Tw2GeometryBatch.prototype.Commit = function (a) {
        var b = typeof a == "undefined" ? this.effect : a;
        this.geometryRes && b && this.geometryRes.RenderAreas(this.meshIx, this.start, this.count, b)
      }, Inherit(Tw2GeometryBatch, Tw2RenderBatch);

      function Tw2GeometryMeshArea() {
        this.name = "", this.start = 0, this.count = 0, this.minBounds = vec3.create(), this.maxBounds = vec3.create(), this.boundsSpherePosition = vec3.create(), this.boundsSphereRadius = 0
      }

      function Tw2GeometryMeshBinding() {
        this.mesh = null, this.bones = []
      }

      function Tw2GeometryModel() {
        this.name = "", this.meshBindings = [], this.skeleton = null
      }
      Tw2GeometryModel.prototype.FindBoneByName = function (a) {
        if (this.skeleton == null) return null;
        for (var b = 0; b < this.skeleton.bones.length; ++b) if (this.skeleton.bones[b].name == a) return this.skeleton.bones[b];
        return null
      };

      function Tw2GeometrySkeleton() {
        this.bones = []
      }

      function Tw2GeometryBone() {
        this.name = "", this.parentIndex = -1, this.position = vec3.create(), this.orientation = quat4.create(), this.scaleShear = mat3.create(), this.localTransform = mat4.create(), this.worldTransform = mat4.create(), this.worldTransformInv = mat4.create()
      }
      Tw2GeometryBone.prototype.UpdateTransform = function () {
        mat3.toMat4(this.scaleShear, this.localTransform), mat4.multiply(this.localTransform, mat4.transpose(quat4.toMat4(quat4.normalize(this.orientation)))), this.localTransform[12] = this.position[0], this.localTransform[13] = this.position[1], this.localTransform[14] = this.position[2];
        return this.localTransform
      };

      function Tw2GeometryAnimation() {
        this.name = "", this.duration = 0, this.trackGroups = []
      }

      function Tw2GeometryTrackGroup() {
        this.name = "", this.model = null, this.transformTracks = []
      }

      function Tw2GeometryTransformTrack() {
        this.name = "", this.position = null, this.orientation = null, this.scaleShear = null
      }

      function Tw2GeometryCurve() {
        this.dimension = 0, this.degree = 0, this.knots = null, this.controls = null
      }

      function Tw2BlendShapeData() {
        this.name = "", this.declaration = new Tw2VertexDeclaration, this.buffers = [], this.indexes = null, this.weightProxy = null
      }
      var tw2TextureResPremultipliedAlphaWorkaround = !1,
        ffVersion = /Firefox\/(\d+)/.exec(navigator.userAgent);
      ffVersion && parseInt(ffVersion[1]) >= 8 && (tw2TextureResPremultipliedAlphaWorkaround = !0);

      function Tw2TextureRes() {
        this._super.constructor.call(this), this.texture = null, this.isCube = !1, this.images = [], this.minFilter = 9987, this.magFilter = 9729, this._facesLoaded = 0
      }
      Tw2TextureRes.prototype.SetFiltering = function (a, b) {
        this.minFilter = a, this.magFilter = b, this.IsGood() && (this.isCube ? (device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, this.texture), device.gl.texParameteri(device.gl.TEXTURE_CUBE_MAP, device.gl.TEXTURE_MAG_FILTER, this.magFilter), device.gl.texParameteri(device.gl.TEXTURE_CUBE_MAP, device.gl.TEXTURE_MIN_FILTER, this.minFilter), device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, null)) : (device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, this.magFilter), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, this.minFilter), device.gl.bindTexture(device.gl.TEXTURE_2D, null)))
      }, Tw2TextureRes.prototype.Prepare = function (a, b) {
        if (a == "cube") {
          this.texture = device.gl.createTexture(), device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, this.texture);
          for (var c = 0; c < 6; ++c) device.gl.texImage2D(device.gl.TEXTURE_CUBE_MAP_POSITIVE_X + c, 0, device.gl.RGBA, device.gl.RGBA, device.gl.UNSIGNED_BYTE, this.images[c]);
          device.gl.texParameteri(device.gl.TEXTURE_CUBE_MAP, device.gl.TEXTURE_MAG_FILTER, this.magFilter), device.gl.texParameteri(device.gl.TEXTURE_CUBE_MAP, device.gl.TEXTURE_MIN_FILTER, this.minFilter), device.gl.generateMipmap(device.gl.TEXTURE_CUBE_MAP), device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, null), this.PrepareFinished(!0)
        } else if (tw2TextureResPremultipliedAlphaWorkaround) {
          var d = device.gl.createTexture();
          device.gl.bindTexture(device.gl.TEXTURE_2D, d), device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, device.gl.RGBA, device.gl.UNSIGNED_BYTE, this.images[0]), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.NEAREST), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.NEAREST), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_WRAP_S, device.gl.CLAMP_TO_EDGE), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_WRAP_T, device.gl.CLAMP_TO_EDGE), device.gl.generateMipmap(device.gl.TEXTURE_2D), device.gl.bindTexture(device.gl.TEXTURE_2D, null);
          var e = device.gl.createTexture();
          device.gl.bindTexture(device.gl.TEXTURE_2D, e), device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGB, device.gl.RGB, device.gl.UNSIGNED_BYTE, this.images[0]), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.NEAREST), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.NEAREST), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_WRAP_S, device.gl.CLAMP_TO_EDGE), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_WRAP_T, device.gl.CLAMP_TO_EDGE), device.gl.generateMipmap(device.gl.TEXTURE_2D), device.gl.bindTexture(device.gl.TEXTURE_2D, null), this.texture = device.gl.createTexture(), device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture), device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, this.images[0].width, this.images[0].height, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, null), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, this.magFilter), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, this.minFilter), device.gl.generateMipmap(device.gl.TEXTURE_2D), device.gl.bindTexture(device.gl.TEXTURE_2D, null);
          var f = ['<?xml version="1.0" ?>', "<effect>", "  <shaders>", '    <shader name="vs"><![CDATA[', "attribute vec3 a_Position;", "varying lowp vec2 v_TexCoord;", "void main(void) {", "    vec4 projPosition = vec4(a_Position.xy, 1.0, 1.0);", "    v_TexCoord = a_Position.xy * 0.5 + vec2(0.5, 0.5);", "    gl_Position = projPosition;", "}", "  ]]>", "    </shader>", '    <shader name="fs"><![CDATA[', "precision highp float;", "uniform sampler2D RGBTexture;", "uniform sampler2D ATexture;", "varying lowp vec2 v_TexCoord;", "void main(void) ", "{", "    vec4 rgbTex = texture2D(RGBTexture, v_TexCoord);", "    vec4 aTex = texture2D(ATexture, v_TexCoord);", "    gl_FragColor = vec4(rgbTex.rgb, aTex.a);", "}", "  ]]>", "    </shader>", "  </shaders>", "  <techniques>", '    <technique name="t0">', '      <pass name="p0" vertexShader="vs" fragmentShader="fs">', "      </pass>", "    </technique>", "  </techniques>", "</effect>"].join("\n");
          typeof this._effect == "undefined" && (this._effect = resMan.GetResource("str:/fx/" + f));
          if (!this._effect.IsGood()) return !0;
          var g = device.gl.createFramebuffer();
          device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, g), device.gl.framebufferTexture2D(device.gl.FRAMEBUFFER, device.gl.COLOR_ATTACHMENT0, device.gl.TEXTURE_2D, this.texture, 0), device.gl.bindRenderbuffer(device.gl.RENDERBUFFER, null), device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, null), device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, g), device.gl.viewport(0, 0, this.images[0].width, this.images[0].height), this._effect.ApplyPass(0, 0);
          var h = this._effect.techniques[0].passes[0].shaderProgram;
          device.gl.activeTexture(device.gl.TEXTURE0), device.gl.bindTexture(device.gl.TEXTURE_2D, e), device.gl.activeTexture(device.gl.TEXTURE0 + 1), device.gl.bindTexture(device.gl.TEXTURE_2D, d);
          var i = device.gl.getUniformLocation(h, "RGBTexture");
          device.gl.uniform1i(i, 0), i = device.gl.getUniformLocation(h, "ATexture"), device.gl.uniform1i(i, 1), device.gl.enableVertexAttribArray(0), device.gl.bindBuffer(device.gl.ARRAY_BUFFER, device._quadBuffer), device.gl.vertexAttribPointer(0, 3, device.gl.FLOAT, !1, 0, 0), device.SetStandardStates(device.RM_OPAQUE), device.gl.disable(device.gl.DEPTH_TEST), device.gl.depthMask(!1), device.gl.drawArrays(device.gl.TRIANGLE_STRIP, 0, 4), device.gl.enable(device.gl.DEPTH_TEST), device.gl.depthMask(!0), device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, null), device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture), device.gl.generateMipmap(device.gl.TEXTURE_2D), device.gl.bindTexture(device.gl.TEXTURE_2D, null), device.gl.deleteFramebuffer(g), device.gl.deleteTexture(e), device.gl.deleteTexture(d), delete this._effect, this.PrepareFinished(!0)
        } else this.texture = device.gl.createTexture(), device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture), device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, device.gl.RGBA, device.gl.UNSIGNED_BYTE, this.images[0]), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, this.magFilter), device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, this.minFilter), device.gl.generateMipmap(device.gl.TEXTURE_2D), device.gl.bindTexture(device.gl.TEXTURE_2D, null), this.PrepareFinished(!0)
      }, Tw2TextureRes.prototype.DoCustomLoad = function (a) {
        this.LoadStarted(), this.images = [];
        var b = this;
        a = resMan.BuildUrl(a);
        var c = "";
        device.mipLevelSkipCount > 0 && (c = "." + device.mipLevelSkipCount.toString());
        if (a.substr(-5) == ".cube") {
          this.isCube = !0, this._facesLoaded = 0;
          var d = a.substr(0, a.length - 5),
            e = [".px", ".nx", ".py", ".ny", ".pz", ".nz"];
          for (var f = 0; f < 6; ++f) this.images[f] = new Image, this.images[f].crossOrigin = "anonymous", this.images[f].onload = function (a) {
            b._facesLoaded++, b._facesLoaded >= 6 && (b.LoadFinished(!0), resMan._prepareQueue.push([b, "cube", null]))
          }, this.images[f].src = d + c + e[f] + ".png"
        } else {
          this.isCube = !1, this.images[0] = new Image, this.images[0].crossOrigin = "anonymous", this.images[0].onload = function () {
            b.LoadFinished(!0), resMan._prepareQueue.push([b, "", null])
          };
          if (device.mipLevelSkipCount > 0) {
            var g = a.lastIndexOf(".");
            g >= 0 && (a = a.substr(0, g) + c + a.substr(g))
          }
          this.images[0].src = a
        }
      }, Tw2TextureRes.prototype.Attach = function (a) {
        this.texture = a, this.LoadFinished(!0), this.PrepareFinished(!0)
      }, Inherit(Tw2TextureRes, Tw2Resource), resMan.RegisterExtension("png", Tw2TextureRes), resMan.RegisterExtension("cube", Tw2TextureRes);

      function Tw2VertexElement(a, b, c) {
        this.usage = a, this.usageIndex = b, this.type = c
      }

      function Tw2VertexDeclaration() {
        this.elements = []
      }
      Tw2VertexDeclaration.prototype.Join = function (a) {
        var b = new Tw2VertexDeclaration;
        for (var c = 0; c < this.elements.length; ++c) b.elements[b.elements.length] = this.elements[c];
        for (var c = 0; c < a.elements.length; ++c) b.Find(a.elements[c]) == -1 && (b.elements[b.elements.length] = a.elements[c]);
        return b
      }, Tw2VertexDeclaration.prototype.Find = function (a) {
        for (var b = 0; b < this.elements.length; ++b) if (this.elements[b].usage == a.usage && this.elements[b].usageIndex == a.usageIndex) return b;
        return -1
      };

      function Tw2EffectRes() {
        this._super.constructor.call(this), this.techniques = []
      }
      Tw2EffectRes.prototype.Prepare = function (a, b) {
        function d(a, c, d) {
          var e = b.getElementsByTagName("shader");
          for (var f = 0; f < e.length; ++f) if (e[f].attributes.getNamedItem("name") && e[f].attributes.getNamedItem("name").value == a) {
            var g = device.gl.createShader(c),
              h = "";
            for (var i = 0; i < e[f].childNodes.length; ++i) h += e[f].childNodes[i].data;
            device.gl.shaderSource(g, h), device.gl.compileShader(g);
            if (!device.gl.getShaderParameter(g, device.gl.COMPILE_STATUS)) {
              log.LogErr("Error compiling shader '" + a + "' (effect '" + d + "'): " + device.gl.getShaderInfoLog(g));
              return null
            }
            return g
          }
          return null
        }
        var c = b.getElementsByTagName("technique");
        if (c.length == 0) log.LogErr("Effect does not have any techniques defined"), this.PrepareFinished(!1);
        else {
          var e = [/^a_Position([0-7]?)$/i, /^a_BlendWeight([0-7]?)$/i, /^a_BlendIndices([0-7]?)$/i, /^a_Normal([0-7]?)$/i, /^a_PSize([0-7]?)$/i, /^a_TexCoord([0-7]?)$/i, /^a_Tangent([0-7]?)$/i, /^a_Binormal([0-7]?)$/i, /^a_TessFactor([0-7]?)$/i, /^a_PositionNT([0-7]?)$/i, /^a_Color([0-7]?)$/i, /^a_Fog([0-7]?)$/i, /^a_Depth([0-7]?)$/i, /^a_Sample([0-7]?)$/i];
          for (var f = 0; f < c.length; ++f) {
            techniqueDesc = c[f], technique = new Object, technique.name = "";
            try {
              technique.name = techniqueDesc.attributes.getNamedItem("name").value
            } catch (g) {}
            technique.passes = [], passes = techniqueDesc.getElementsByTagName("pass"), c.length == 0 && log.LogWarn("Effect's technique '" + technique.name + "' contains no passes");
            for (var h = 0; h < passes.length; ++h) {
              pass = new Object, passDesc = passes[h], pass.name = "";
              try {
                pass.name = passDesc.attributes.getNamedItem("name").value
              } catch (g) {}
              pass.vertexShader = null, pass.pixelShader = null;
              try {
                vsName = passDesc.attributes.getNamedItem("vertexShader").value
              } catch (g) {
                log.LogErr("Can't find vertex shader name for pass '" + pass.name + "'"), this.PrepareFinished(!1);
                return
              }
              pass.vertexShader = d(vsName, device.gl.VERTEX_SHADER, this.path);
              if (pass.vertexShader == null) {
                this.PrepareFinished(!1);
                return
              }
              try {
                fsName = passDesc.attributes.getNamedItem("fragmentShader").value
              } catch (g) {
                log.LogErr("Can't find fragment shader name for pass '" + pass.name + "'"), this.PrepareFinished(!1);
                return
              }
              pass.fragmentShader = d(fsName, device.gl.FRAGMENT_SHADER, this.path);
              if (pass.fragmentShader == null) {
                this.PrepareFinished(!1);
                return
              }
              pass.shaderProgram = device.gl.createProgram(), device.gl.attachShader(pass.shaderProgram, pass.vertexShader), device.gl.attachShader(pass.shaderProgram, pass.fragmentShader), device.gl.linkProgram(pass.shaderProgram);
              if (!device.gl.getProgramParameter(pass.shaderProgram, device.gl.LINK_STATUS)) {
                log.LogErr("Error linking shaders: " + device.gl.getProgramInfoLog(pass.shaderProgram)), this.PrepareFinished(!1);
                return
              }
              device.gl.useProgram(pass.shaderProgram), pass.vertexInput = new Tw2VertexDeclaration;
              var i = device.gl.getProgramParameter(pass.shaderProgram, device.gl.ACTIVE_ATTRIBUTES);
              for (var f = 0; f < i; ++f) {
                var j = device.gl.getActiveAttrib(pass.shaderProgram, f),
                  k = !1;
                for (var l = 0; l < e.length; ++l) {
                  var m = e[l].exec(j.name);
                  if (m) {
                    var n = 0;
                    m[1] != "" && (n = 0 + m[1]), pass.vertexInput.elements[pass.vertexInput.elements.length] = new Tw2VertexElement(l, n), pass.vertexInput.elements[pass.vertexInput.elements.length - 1].attribute = device.gl.getAttribLocation(pass.shaderProgram, j.name), k = !0;
                    break
                  }
                }
                if (!k) {
                  log.LogErr("Error linking vertex attribute named '" + j.name + "'"), this.PrepareFinished(!1);
                  return
                }
              }
              pass.states = [], srcBlend = null, destBlend = null;
              for (var f = 0; f < passDesc.childNodes.length; ++f) {
                var o = passDesc.childNodes[f];
                if (o.nodeName == "#text") continue;
                if (o.nodeName == "cullFace") {
                  try {
                    var p = o.attributes.getNamedItem("enable").value
                  } catch (g) {
                    log.LogWarn("Invalid value for cullFace render state in effect " + this.path)
                  }
                  p.toLowerCase() == "true" ? pass.states[pass.states.length] = [device.gl.enable, [device.gl.CULL_FACE]] : pass.states[pass.states.length] = [device.gl.disable, [device.gl.CULL_FACE]]
                } else if (o.nodeName == "depthMask") {
                  try {
                    var p = o.attributes.getNamedItem("enable").value
                  } catch (g) {
                    log.LogWarn("Invalid value for cullFace render state in effect " + this.path)
                  }
                  p.toLowerCase() == "true" ? pass.states[pass.states.length] = [device.gl.depthMask, [!0]] : pass.states[pass.states.length] = [device.gl.depthMask, [!1]]
                } else if (o.nodeName == "depthTest") {
                  try {
                    var p = o.attributes.getNamedItem("enable").value
                  } catch (g) {
                    log.LogWarn("Invalid value for depthTest render state in effect " + this.path)
                  }
                  p.toLowerCase() == "true" ? pass.states[pass.states.length] = [device.gl.enable, [device.gl.DEPTH_TEST]] : pass.states[pass.states.length] = [device.gl.disable, [device.gl.DEPTH_TEST]]
                } else if (o.nodeName == "alphaBlendEnable") {
                  try {
                    var p = o.attributes.getNamedItem("enable").value
                  } catch (g) {
                    log.LogWarn("Invalid value for alphaBlendEnable render state in effect " + this.path)
                  }
                  p.toLowerCase() == "true" ? pass.states[pass.states.length] = [device.gl.enable, [device.gl.BLEND]] : pass.states[pass.states.length] = [device.gl.disable, [device.gl.BLEND]]
                } else if (o.nodeName == "frontFace") {
                  try {
                    var p = o.attributes.getNamedItem("direction").value
                  } catch (g) {
                    log.LogWarn("Invalid value for frontFace render state in effect " + this.path)
                  }
                  p.toLowerCase() == "cw" ? pass.states[pass.states.length] = [device.gl.frontFace, [device.gl.CW]] : pass.states[pass.states.length] = [device.gl.frontFace, [device.gl.CCW]]
                } else if (o.nodeName == "srcBlend") {
                  try {
                    var p = o.attributes.getNamedItem("blend").value
                  } catch (g) {
                    log.LogWarn("Invalid value for srcBlend render state in effect " + this.path)
                  }
                  p.toLowerCase() == "srcalpha" ? srcBlend = device.gl.SRC_ALPHA : p.toLowerCase() == "one" && (srcBlend = device.gl.ONE)
                } else if (o.nodeName == "destBlend") {
                  try {
                    var p = o.attributes.getNamedItem("blend").value
                  } catch (g) {
                    log.LogWarn("Invalid value for destBlend render state in effect " + this.path)
                  }
                  p.toLowerCase() == "invsrcalpha" ? destBlend = device.gl.ONE_MINUS_SRC_ALPHA : p.toLowerCase() == "one" && (destBlend = device.gl.ONE)
                } else log.LogWarn("Unknown render state '" + o.nodeName + "' in effect " + this.path)
              }
              if (srcBlend != null || destBlend != null) srcBlend == null && (srcBlend = device.gl.ONE), destBlend == null && (destBlend = device.gl.ZERO), pass.states[pass.states.length] = [device.gl.blendFunc, [srcBlend, destBlend]];
              technique.passes[technique.passes.length] = pass
            }
            technique.vertexInput = new Tw2VertexDeclaration;
            for (var f = 0; f < technique.passes.length; ++f) technique.vertexInput = technique.vertexInput.Join(technique.passes[f].vertexInput);
            this.techniques[this.techniques.length] = technique
          }
          this.PrepareFinished(!0)
        }
      }, Tw2EffectRes.prototype.ApplyPass = function (a, b) {
        device.gl.useProgram(this.techniques[a].passes[b].shaderProgram);
        for (var c = 0; c < this.techniques[a].passes[b].states.length; ++c) this.techniques[a].passes[b].states[c][0].apply(device.gl, this.techniques[a].passes[b].states[c][1]);
        this.techniques[a].passes[b].states.length && (device._currentRenderMode = null)
      }, Inherit(Tw2EffectRes, Tw2Resource), resMan.RegisterExtension("fx", Tw2EffectRes);

      function Tw2Effect() {
        this.name = "", this.effectFilePath = "", this.effectRes = null, this.activeTechnique = 0, this.parameters = new Object, this.activeParameters = [], this.additionalParameters = null
      }
      Tw2Effect.prototype.Initialize = function () {
        this.effectFilePath != "" && (this.effectRes = resMan.GetResource(this.effectFilePath), this.effectRes.RegisterNotification(this))
      }, Tw2Effect.prototype.GetEffectRes = function () {
        return this.effectRes
      }, Tw2Effect.prototype.GetActiveTechnique = function () {
        return this.activeTechnique
      }, Tw2Effect.prototype.ReleaseCachedData = function (a) {
        this.activeParameters = []
      }, Tw2Effect.prototype.RebuildCachedData = function (a) {
        a.IsGood() && this.BindParameters()
      }, Tw2Effect.prototype.FindParameter = function (a) {
        return a in this.parameters ? this.parameters[a] : a in variableStore._variables ? variableStore._variables[a] : null
      }, Tw2Effect.prototype.BindParameters = function () {
        if (this.effectRes == null || !this.effectRes.IsGood()) return !1;
        this.activeParameters = [];
        for (var a = 0; a < this.effectRes.techniques.length; ++a) {
          this.activeParameters[a] = [];
          for (var b = 0; b < this.effectRes.techniques[a].passes.length; ++b) {
            var c = this.effectRes.techniques[a].passes[b];
            this.activeParameters[a][b] = [];
            var d = device.gl.getProgramParameter(c.shaderProgram, device.gl.ACTIVE_UNIFORMS);
            for (var e = 0; e < d; ++e) {
              var f = device.gl.getActiveUniform(c.shaderProgram, e),
                g = this.FindParameter(f.name);
              g != null && (this.activeParameters[a][b][this.activeParameters[a][b].length] = [g, device.gl.getUniformLocation(c.shaderProgram, g.name)])
            }
          }
        }
        return !0
      }, Tw2Effect.prototype.ApplyPass = function (a, b) {
        if (!(this.effectRes == null || !this.effectRes.IsGood() || a >= this.effectRes.techniques.length)) {
          device.ResetActiveTextures(), this.effectRes.ApplyPass(a, b);
          var c = this.activeParameters[a][b],
            d = this.effectRes.techniques[a].passes[b].shaderProgram;
          for (var e = 0; e < c.length; ++e) c[e][0].Apply(d, c[e][1]);
          device.perObjectData && device.perObjectData.ApplyShaderParameters(d)
        }
      }, Tw2Effect.prototype.GetPassCount = function (a) {
        return this.effectRes == null || !this.effectRes.IsGood() || a >= this.effectRes.techniques.length ? 0 : this.effectRes.techniques[a].passes.length
      }, Tw2Effect.prototype.GetPassInput = function (a, b) {
        return this.effectRes == null || !this.effectRes.IsGood() || a >= this.effectRes.techniques.length ? null : this.effectRes.techniques[a].passes[b].vertexInput
      };

      function Tw2MeshArea() {
        this.name = "", this.effect = null, this.meshIndex = 0, this.index = 0, this.count = 1, this.debugIsHidden = !1
      }

      function Tw2Mesh() {
        this.name = "", this.meshIndex = 0, this.geometryResPath = "", this.lowDetailGeometryResPath = "", this.geometryResource = null, this.opaqueAreas = [], this.transparentAreas = [], this.transparentAreas = [], this.additiveAreas = [], this.pickableAreas = [], this.decalAreas = [], this.depthAreas = [], this.debugIsHidden = !1
      }
      Tw2Mesh.prototype.Initialize = function () {
        this.geometryResPath != "" && (this.geometryResource = resMan.GetResource(this.geometryResPath))
      }, Tw2Mesh.prototype._GetAreaBatches = function (a, b, c, d) {
        for (var e = 0; e < a.length; ++e) {
          var f = a[e];
          if (f.effect == null || f.debugIsHidden) continue;
          var g = new Tw2GeometryBatch;
          g.renderMode = b, g.perObjectData = d, g.geometryRes = this.geometryResource, g.meshIx = f.meshIndex, g.start = f.index, g.count = f.count, g.effect = f.effect, c.Commit(g)
        }
      }, Tw2Mesh.prototype.GetBatches = function (a, b, c) {
        if (this.geometryResource == null || this.debugIsHidden) return !1;
        a == device.RM_OPAQUE ? this._GetAreaBatches(this.opaqueAreas, a, b, c) : a == device.RM_DECAL ? this._GetAreaBatches(this.decalAreas, a, b, c) : a == device.RM_TRANSPARENT ? this._GetAreaBatches(this.transparentAreas, a, b, c) : a == device.RM_ADDITIVE && this._GetAreaBatches(this.additiveAreas, a, b, c);
        return !0
      };

      function Tw2Track() {
        this.trackRes = null, this.bone = null
      }

      function Tw2TrackGroup() {
        this.trackGroupRes = null, this.model = null, this.transformTracks = []
      }

      function Tw2Animation() {
        this.animationRes = null, this.time = 0, this.timeScale = 1, this.cycle = !1, this.isPlaying = !1, this.callback = null, this.trackGroups = []
      }
      Tw2Animation.prototype.IsFinished = function () {
        return !this.cycle && this.time >= this.duration
      };

      function Tw2Bone() {
        this.boneRes = null, this.localTransform = mat4.create(), this.worldTransform = mat4.create(), this.offsetTransform = mat4.create()
      }

      function Tw2Model() {
        this.modelRes = null, this.bones = []
      }

      function Tw2AnimationController(a) {
        this.geometryResources = [], this.models = [], this.animations = [], this.meshBindings = [], this.loaded = !1, this.update = !0, typeof a != "undefined" && this.SetGeometryResource(a)
      }
      Tw2AnimationController.prototype.SetGeometryResource = function (a) {
        this.models = [], this.animations = [], this.meshBindings = [];
        for (var b = 0; b < this.geometryResources.length; ++b) this.geometryResources[b].UnregisterNotification(this);
        this.loaded = !1, this.geometryResources = [], a && (this.geometryResources.push(a), a.RegisterNotification(this))
      }, Tw2AnimationController.prototype.AddGeometryResource = function (a) {
        for (var b = 0; b < this.geometryResources.length; ++b) if (this.geometryResources[b] == a) return;
        this.geometryResources.push(a), a.RegisterNotification(this)
      }, Tw2AnimationController.prototype.AddAnimationsFromRes = function (a) {
        for (var b = 0; b < a.animations.length; ++b) {
          var c = null;
          for (var d = 0; d < this.animations.length; ++d) if (this.animations[d].animationRes == a.animations[b]) {
            c = this.animations[b];
            break
          }
          c || (c = new Tw2Animation, c.animationRes = a.animations[b], this.animations.push(c));
          for (var d = 0; d < c.animationRes.trackGroups.length; ++d) {
            var e = !1;
            for (var f = 0; f < c.trackGroups.length; ++f) if (c.trackGroups[f].trackGroupRes == c.animationRes.trackGroups[d]) {
              e = !0;
              break
            }
            if (e) continue;
            var g = null;
            for (var f = 0; f < this.models.length; ++f) if (this.models[f].modelRes.name == c.animationRes.trackGroups[d].name) {
              g = this.models[f];
              break
            }
            if (g != null) {
              var h = new Tw2TrackGroup;
              h.trackGroupRes = c.animationRes.trackGroups[d];
              for (var f = 0; f < h.trackGroupRes.transformTracks.length; ++f) for (var i = 0; i < g.bones.length; ++i) if (g.bones[i].boneRes.name == h.trackGroupRes.transformTracks[f].name) {
                var j = new Tw2Track;
                j.trackRes = h.trackGroupRes.transformTracks[f], j.bone = g.bones[i], h.transformTracks.push(j);
                break
              }
              c.trackGroups.push(h)
            }
          }
        }
      }, Tw2AnimationController.prototype._AddModel = function (a) {
        for (var b = 0; b < this.models.length; ++b) if (this.models[b].modelRes.name == a.name) return null;
        var c = new Tw2Model;
        c.modelRes = a;
        var d = a.skeleton;
        if (d != null) for (var e = 0; e < d.bones.length; ++e) {
          var f = new Tw2Bone;
          f.boneRes = d.bones[e], c.bones.push(f)
        }
        this.models.push(c);
        return c
      }, Tw2AnimationController.prototype._FindMeshBindings = function (a) {
        for (var b = 0; b < this.meshBindings.length; ++b) if (this.meshBindings[b].resource == a) return this.meshBindings[b];
        return null
      }, Tw2AnimationController.prototype.RebuildCachedData = function (a) {
        var b = !1;
        for (var c = 0; c < this.geometryResources.length; ++c) if (this.geometryResources[c] == a) {
          b = !0;
          break
        }
        if ( !! b) {
          var d = [];
          if (a.meshes.length) for (var c = 0; c < a.models.length; ++c) {
            var e = this._AddModel(a.models[c]);
            e && d.push(e)
          }
          for (var c = 0; c < this.geometryResources.length; ++c) this.AddAnimationsFromRes(this.geometryResources[c], this.models);
          for (var c = 0; c < a.models.length; ++c) {
            var e = null;
            for (var f = 0; f < this.models.length; ++f) if (this.models[f].modelRes.name == a.models[c].name) {
              e = this.models[f];
              break
            }
            if (e == null) continue;
            for (var f = 0; f < a.models[c].meshBindings.length; ++f) {
              var g = a.meshes.indexOf(a.models[c].meshBindings[f].mesh),
                h = this._FindMeshBindings(a);
              h == null && (h = [], h.resource = a, this.meshBindings.push(h)), h[g] = new glMatrixArrayType(a.models[c].meshBindings[f].bones.length * 16);
              for (var i = 0; i < a.models[c].meshBindings[f].bones.length; ++i) for (var j = 0; j < e.bones.length; ++j) if (e.bones[j].boneRes.name == a.models[c].meshBindings[f].bones[i].name) {
                e.bones[j].bindingArrays || (e.bones[j].bindingArrays = []);
                var k = {
                  array: h[g],
                  offset: i * 16
                };
                e.bones[j].bindingArrays[e.bones[j].bindingArrays.length] = k;
                break
              }
            }
          }
          a.meshes.length && a.models.length && this.ResetBoneTransforms(a.models), this.loaded = !0
        }
      }, Tw2AnimationController.prototype.PlayAnimation = function (a, b, c) {
        for (var d = 0; d < this.animations.length; ++d) this.animations[d].animationRes.name == a && (this.animations[d].time = 0, this.animations[d].isPlaying = !0, typeof b != "undefined" && (this.animations[d].cycle = b), typeof c != "undefined" && (this.animations[d].callback = c))
      }, Tw2AnimationController.prototype.StopAnimation = function (a) {
        for (var b = 0; b < this.animations.length; ++b) this.animations[b].animationRes.name == a && (this.animations[b].isPlaying = !1)
      }, Tw2AnimationController.prototype.StopAllAnimations = function () {
        for (var a = 0; a < this.animations.length; ++a) this.animations[a].isPlaying = !1
      }, Tw2AnimationController.prototype.ResetBoneTransforms = function (a) {
        for (var b = 0; b < this.models.length; ++b) for (var c = 0; c < this.models[b].bones.length; ++c) {
          var d = this.models[b].bones[c],
            e = d.boneRes;
          mat4.set(e.localTransform, d.localTransform), e.parentIndex != -1 ? mat4.multiply(d.localTransform, this.models[b].bones[d.boneRes.parentIndex].worldTransform, d.worldTransform) : mat4.set(d.localTransform, d.worldTransform), mat4.identity(d.offsetTransform)
        }
        var f = mat4.identity(mat4.create());
        for (var b = 0; b < this.meshBindings.length; ++b) for (var c = 0; c < this.meshBindings[b].length; ++c) for (var g = 0; g * 16 < this.meshBindings[b][c].length; ++g) for (var h = 0; h < 16; ++h) this.meshBindings[b][c][g * 16 + h] = f[h]
      }, Tw2AnimationController.prototype.Update = function (a) {
        function b(a, b, c) {
          var d = a.knots.length - 1,
            e = 0;
          for (var f = a.degree; f < a.knots.length; ++f) if (a.knots[f] > b) {
            if (f == 0) d = 0;
            else {
              d = f;
              var g = a.knots[f] - a.knots[f - 1];
              g > 0 && (e = (b - a.knots[f - 1]) / g)
            }
            break
          }
          if (a.degree == 0) for (var f = 0; f < a.dimension; ++f) c[f] = a.controls[d * a.dimension + f];
          else if (a.degree == 1) {
            var h = d - 1;
            for (var f = 0; f < a.dimension; ++f) c[f] = a.controls[h * a.dimension + f] * (1 - e) + a.controls[d * a.dimension + f] * e
          } else {
            var i = (d - 2) * a.dimension,
              j = (d - 1) * a.dimension,
              k = d * a.dimension;
            for (var f = 0; f < a.dimension; ++f) {
              var l = (a.controls[i + f] - 2 * a.controls[j + f] + a.controls[k + f]) * .5,
                m = (-2 * a.controls[i + f] + 2 * a.controls[j + f]) * .5,
                n = (a.controls[i + f] + a.controls[j + f]) * .5;
              c[f] = l * e * e + m * e + n
            }
          }
        }
        if (this.models != null && !! this.update) {
          var c = !1;
          for (var d = 0; d < this.animations.length; ++d) {
            var e = this.animations[d];
            if (e.isPlaying) {
              var f = e.animationRes;
              e.time += a * e.timeScale, e.time > f.duration && (e.callback != null && e.callback(this, e), e.cycle ? e.time = e.time % f.duration : (e.isPlaying = !1, e.time = f.duration));
              for (var g = 0; g < e.trackGroups.length; ++g) for (var h = 0; h < e.trackGroups[g].transformTracks.length; ++h) {
                var i = e.trackGroups[g].transformTracks[h],
                  j = vec3.create();
                i.trackRes.position ? b(i.trackRes.position, e.time, j) : vec3.set([0, 0, 0], j);
                var k = quat4.create();
                i.trackRes.orientation ? (b(i.trackRes.orientation, e.time, k), quat4.normalize(k)) : quat4.set([0, 0, 0, 1], k);
                var l = mat3.create();
                i.trackRes.scaleShear ? b(i.trackRes.scaleShear, e.time, l) : mat3.identity(l), mat3.toMat4(l, i.bone.localTransform), mat4.multiply(i.bone.localTransform, mat4.transpose(quat4.toMat4(k))), i.bone.localTransform[12] = j[0], i.bone.localTransform[13] = j[1], i.bone.localTransform[14] = j[2], c = !0
              }
            }
          }
          for (var d = 0; d < this.models.length; ++d) for (var g = 0; g < this.models[d].bones.length; ++g) {
            var m = this.models[d].bones[g];
            m.boneRes.parentIndex != -1 ? mat4.multiply(this.models[d].bones[m.boneRes.parentIndex].worldTransform, m.localTransform, m.worldTransform) : mat4.set(m.localTransform, m.worldTransform), mat4.multiply(m.worldTransform, m.boneRes.worldTransformInv, m.offsetTransform);
            if (m.bindingArrays) for (var n = 0; n < m.bindingArrays.length; ++n) for (var o = 0; o < 16; ++o) m.bindingArrays[n].array[m.bindingArrays[n].offset + o] = m.offsetTransform[o]
          }
        }
      }, Tw2AnimationController.prototype.RenderDebugInfo = function (a) {
        for (var b = 0; b < this.models.length; ++b) for (var c = 0; c < this.models[b].bones.length; ++c) {
          var d = this.models[b].bones[c];
          if (d.boneRes.parentIndex >= 0) {
            var e = this.models[b].bones[d.boneRes.parentIndex];
            a.AddLine([d.worldTransform[12], d.worldTransform[13], d.worldTransform[14]], [e.worldTransform[12], e.worldTransform[13], e.worldTransform[14]])
          }
        }
      }, Tw2AnimationController.prototype.GetBoneMatrixes = function (a, b) {
        if (this.geometryResources.length == 0) return [];
        typeof b == "undefined" && (b = this.geometryResources[0]);
        var c = this._FindMeshBindings(b);
        return c && a < c.length ? c[a] : []
      }, Tw2AnimationController.prototype.FindModelForMesh = function (a, b) {
        if (this.geometryResources.length == 0) return null;
        typeof b == "undefined" && (b = this.geometryResources[0]);
        if (!b.IsGood()) return null;
        var c = b.meshes[a];
        for (var d = 0; d < this.models.length; ++d) for (var e = 0; e < this.models[d].modelRes.meshBindings.length; ++d) if (this.models[d].modelRes.meshBindings[e].mesh = c) return this.models[d];
        return null
      };

      function EveSkybox() {
        this.envMapPath = "", this.envMapRes = null, this.effect = null
      }
      EveSkybox.prototype.Initialize = function () {
        this.envMapPath != "" && (this.envMapRes = resMan.GetResource(eval(ref.selectedShip.nebula)[0]))
      }, EveSkybox.prototype.Render = function () {
        this.envMapRes != null && (device.SetStandardStates(device.RM_OPAQUE), device.gl.disable(device.gl.DEPTH_TEST), device.RenderFullScreenQuad(this.effect), device.gl.enable(device.gl.DEPTH_TEST))
      };

      function EveLocator() {
        this.name = "", this.transform = mat4.create()
      }

      function EveBoosterSet() {
        this.display = !0, this.effect = null, this.glows = null, this.glowScale = 1, this.glowColor = [0, 0, 0, 0], this.symHaloScale = 1, this.haloScaleX = 1, this.haloScaleY = 1, this.maxVel = 250, this.haloColor = [0, 0, 0, 0], this.alwaysOn = !0, this._parentTransform = mat4.create(), this._wavePhase = mat4.create(), this._boosterTransforms = [];
        var a = [],
          b = [];
        for (var c = 0; c < 4; ++c) {
          var d = c * Math.PI / 4,
            e = Math.cos(d) * .5,
            f = Math.sin(d) * .5;
          a.push(-e), a.push(-f), a.push(0), a.push(e), a.push(f), a.push(-1), a.push(-e), a.push(-f), a.push(-1), a.push(-e), a.push(-f), a.push(0), a.push(e), a.push(f), a.push(0), a.push(e), a.push(f), a.push(-1), b.push(1), b.push(1), b.push(0), b.push(0), b.push(1), b.push(0), b.push(1), b.push(1), b.push(0), b.push(1), b.push(0), b.push(0)
        }
        this._positions = device.gl.createBuffer(), device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._positions), device.gl.bufferData(device.gl.ARRAY_BUFFER, new Float32Array(a), device.gl.STATIC_DRAW), this._texCoords = device.gl.createBuffer(), device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._texCoords), device.gl.bufferData(device.gl.ARRAY_BUFFER, new Float32Array(b), device.gl.STATIC_DRAW), this.rebuildPending = !1
      }
      EveBoosterSet.prototype.Initialize = function () {
        this.rebuildPending = !0
      }, EveBoosterSet.prototype.Clear = function () {
        this._boosterTransforms = [], this._wavePhase = mat4.create(), this.glows && this.glows.Clear()
      }, EveBoosterSet.prototype.Add = function (a) {
        var b = mat4.create();
        mat4.set(a, b), this._boosterTransforms[this._boosterTransforms.length] = b, this._wavePhase[this._wavePhase.length] = Math.random();
        if (this.glows) {
          var c = vec3.create([a[12], a[13], a[14]]),
            d = vec3.create([a[8], a[9], a[10]]),
            e = vec3.length(d),
            f = vec3.create();
          vec3.subtract(c, vec3.scale(d, 2.5, f), f), this.glows.Add(f, 0, 0, e * this.glowScale, e * this.glowScale, 0, this.glowColor), vec3.subtract(c, vec3.scale(d, 3, f), f), this.glows.Add(f, 0, 1, e * this.symHaloScale, e * this.symHaloScale, 0, this.haloColor), vec3.subtract(c, vec3.scale(d, 3.01, f), f), this.glows.Add(f, 0, 1, e * this.haloScaleX, e * this.haloScaleY, 0, this.haloColor)
        }
      }, EveBoosterSet.prototype.Rebuild = function () {
        this.rebuildPending = !1, this.glows.RebuildBuffers()
      }, EveBoosterSet.prototype.Update = function (a, b) {
        this.glows && this.glows.Update(a), this._parentTransform = b
      };

      function EveBoosterBatch() {
        this.renderMode = device.RM_ANY, this.perObjectData = null, this.boosters = null
      }
      EveBoosterBatch.prototype.Commit = function (a) {
        this.boosters.Render(a)
      }, EveBoosterSet.prototype.GetBatches = function (a, b, c) {
        if (a == device.RM_ADDITIVE) {
          if (this.effect && this._boosterTransforms.length) {
            var d = new EveBoosterBatch;
            d.perObjectData = c, d.boosters = this, d.renderMode = device.RM_ADDITIVE, b.Commit(d)
          }
          this.glows && this.glows.GetBatches(a, b, c)
        }
      }, EveBoosterSet.prototype.Render = function (a) {
        var b = typeof a == "undefined" ? this.effect : a,
          c = b.GetEffectRes();
        if (!c.IsGood()) return !1;
        var d = b.GetActiveTechnique(),
          e = mat4.create();
        device.perObjectData.RegisterVariableWithType("WavePhase", this._wavePhase[f], Tw2FloatParameter);
        for (var f = 0; f < this._boosterTransforms.length; ++f) {
          mat4.multiply(this._parentTransform, this._boosterTransforms[f], e), device.SetWorld(e);
          for (var g = 0; g < b.GetPassCount(d); ++g) {
            b.ApplyPass(d, g);
            var h = b.GetPassInput(d, g);
            for (var i = 0; i < h.elements.length; ++i) {
              if (h.elements[i].usage != 0 && h.elements[i].usage != 5) {
                log.LogErr("Error binding vertex buffer to effect attribute for usage " + h.elements[i].usage + " and index " + h.elements[i].usageIndex);
                return !1
              }
              device.gl.enableVertexAttribArray(i), h.elements[i].usage == 0 ? (device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._positions), device.gl.vertexAttribPointer(i, 3, device.gl.FLOAT, !1, 0, 0)) : (device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._texCoords), device.gl.vertexAttribPointer(i, 2, device.gl.FLOAT, !1, 0, 0))
            }
            device.gl.drawArrays(device.gl.TRIANGLES, 0, 24)
          }
        }
        return !0
      };

      function EveSpriteSet() {
        this.sprites = [], this.effect = null, this._time = 0, this.vertexBuffer = null, this.indexBuffer = null
      }
      EveSpriteSet.prototype.Initialize = function () {
        this.RebuildBuffers(), this.effect && typeof this.effect.parameters.GradientMap != "undefined" && (this.effect.parameters.GradientMap.wrapS = 33071, this.effect.parameters.GradientMap.wrapT = 33071)
      }, EveSpriteSet.prototype.RebuildBuffers = function () {
        var a = 12,
          b = new Float32Array(this.sprites.length * 4 * a);
        for (var c = 0; c < this.sprites.length; ++c) {
          var d = c * 4 * a;
          b[d + 0 * a + 0] = 1, b[d + 0 * a + 1] = 1, b[d + 1 * a + 0] = -1, b[d + 1 * a + 1] = 1, b[d + 2 * a + 0] = 1, b[d + 2 * a + 1] = -1, b[d + 3 * a + 0] = -1, b[d + 3 * a + 1] = -1;
          for (var e = 0; e < 4; ++e) {
            var f = d + e * a;
            b[f + 2] = this.sprites[c].position[0], b[f + 3] = this.sprites[c].position[1], b[f + 4] = this.sprites[c].position[2], b[f + 5] = this.sprites[c].minScale, b[f + 6] = this.sprites[c].maxScale, b[f + 7] = this.sprites[c].blinkRate, b[f + 8] = this.sprites[c].blinkPhase, b[f + 9] = this.sprites[c].color[0], b[f + 10] = this.sprites[c].color[1], b[f + 11] = this.sprites[c].color[2]
          }
        }
        this.vertexBuffer = device.gl.createBuffer(), device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this.vertexBuffer), device.gl.bufferData(device.gl.ARRAY_BUFFER, b, device.gl.STATIC_DRAW), device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
        var g = new Uint16Array(this.sprites.length * 6);
        for (var c = 0; c < this.sprites.length; ++c) {
          var d = c * 6,
            f = c * 4;
          g[d] = f, g[d + 1] = f + 1, g[d + 2] = f + 2, g[d + 3] = f + 2, g[d + 4] = f + 1, g[d + 5] = f + 3
        }
        this.indexBuffer = device.gl.createBuffer(), device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer), device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, g, device.gl.STATIC_DRAW), device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, null), this.indexBuffer.count = this.sprites.length * 6
      };

      function EveSpriteSetBatch() {
        this._super.constructor.call(this), this.spriteSet = null
      }
      EveSpriteSetBatch.prototype.Commit = function (a) {
        this.spriteSet.Render(a)
      }, Inherit(EveSpriteSetBatch, Tw2RenderBatch), EveSpriteSet.prototype.GetBatches = function (a, b, c) {
        if (a == device.RM_ADDITIVE) {
          var d = new EveSpriteSetBatch;
          d.renderMode = device.RM_ADDITIVE, d.spriteSet = this, d.perObjectData = c, b.Commit(d)
        }
      }, EveSpriteSet.prototype.Render = function (a) {
        var b = typeof a == "undefined" ? this.effect : a;
        if ( !! b && !! this.vertexBuffer) {
          var c = b.GetEffectRes();
          if (!c.IsGood()) return;
          var d = b.GetActiveTechnique();
          device.SetStandardStates(device.RM_ADDITIVE), device.gl.enableVertexAttribArray(0), device.gl.enableVertexAttribArray(1), device.gl.enableVertexAttribArray(2), device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this.vertexBuffer), device.gl.vertexAttribPointer(0, 4, device.gl.FLOAT, !1, 48, 0), device.gl.vertexAttribPointer(1, 4, device.gl.FLOAT, !1, 48, 16), device.gl.vertexAttribPointer(2, 4, device.gl.FLOAT, !1, 48, 32), device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
          for (var e = 0; e < b.GetPassCount(d); ++e) b.ApplyPass(d, e), device.gl.drawElements(device.gl.TRIANGLES, this.indexBuffer.count, device.gl.UNSIGNED_SHORT, 0)
        }
      }, EveSpriteSet.prototype.Update = function (a) {
        this._time += a
      }, EveSpriteSet.prototype.Clear = function () {
        this.sprites = []
      }, EveSpriteSet.prototype.Add = function (a, b, c, d, e, f, g) {
        var h = new EveSpriteSetItem;
        h.position = vec3.create(a), h.blinkRate = b, h.blinkPhase = c, h.minScale = d, h.maxScale = e, h.falloff = f, h.color = g, this.sprites[this.sprites.length] = h
      };

      function EveSpriteSetItem() {
        this.name = "", this.position = vec3.create([0, 0, 0]), this.blinkRate = 0, this.blinkPhase = 0, this.minScale = 1, this.maxScale = 1, this.falloff = 0, this.color = vec3.create([0, 0, 0])
      }

      function EveTransform() {
        this.NONE = 0, this.BILLBOARD = 1, this.TRANSLATE_WITH_CAMERA = 2, this.LOOK_AT_CAMERA = 3, this.SIMPLE_HALO = 4, this.EVE_CAMERA_ROTATION_ALIGNED = 100, this.EVE_BOOSTER = 101, this.EVE_SIMPLE_HALO = 102, this.EVE_CAMERA_ROTATION = 103, this.name = "", this.display = !0, this.useDistanceBasedScale = !1, this.modifier = this.NONE, this.scaling = vec3.create([1, 1, 1]), this.translation = vec3.create([0, 0, 0]), this.rotation = [0, 0, 0, 1], this.localTransform = mat4.create(), this.rotationTransform = mat4.create(), mat4.identity(this.localTransform), this.worldTransform = mat4.create(), mat4.identity(this.worldTransform), this.sortValueMultiplier = 1, this.distanceBasedScaleArg1 = .2, this.distanceBasedScaleArg2 = .63, this.children = [], this.mesh = null
      }
      EveTransform.prototype.Initialize = function () {
        mat4.identity(this.localTransform), mat4.translate(this.localTransform, this.translation), mat4.transpose(quat4.toMat4(this.rotation, this.rotationTransform)), mat4.multiply(this.localTransform, this.rotationTransform, this.localTransform), mat4.scale(this.localTransform, this.scaling)
      }, EveTransform.prototype.GetBatches = function (a, b) {
        if ( !! this.display) {
          if (this.mesh != null) {
            var c = new Tw2PerObjectData;
            c.world = this.worldTransform, this.mesh.GetBatches(a, b, c)
          }
          for (var d = 0; d < this.children.length; ++d) this.children[d].GetBatches(a, b)
        }
      }, EveTransform.prototype.Update = function (a) {
        for (var b = 0; b < this.children.length; ++b) this.children[b].Update(a)
      }, mat4.multiply3x3 = function (a, b, c) {
        c || (c = b);
        var d = b[0],
          e = b[1];
        b = b[2], c[0] = a[0] * d + a[4] * e + a[8] * b, c[1] = a[1] * d + a[5] * e + a[9] * b, c[2] = a[2] * d + a[6] * e + a[10] * b;
        return c
      }, EveTransform.prototype.UpdateViewDependentData = function (a) {
        switch (this.modifier) {
          case this.BILLBOARD:
          case this.SIMPLE_HALO:
            mat4.multiply(a, this.localTransform, this.worldTransform);
            var b = vec3.create();
            vec3.set(this.scaling, b);
            var c = vec3.length([a[0], a[1], a[2]]),
              d = vec3.length([a[4], a[5], a[6]]),
              e = vec3.length([a[8], a[9], a[10]]);
            b[0] *= c, b[1] *= d, b[2] *= e;
            if (this.modifier == this.SIMPLE_HALO) {
              var f = vec3.create([this.worldTransform[12], this.worldTransform[13], this.worldTransform[14]]),
                g = device.GetEyePosition(),
                h = vec3.create();
              vec3.subtract(g, f, h);
              var i = vec3.create(),
                j = vec3.dot(vec3.normalize(h), vec3.normalize(vec3.create([this.worldTransform[8], this.worldTransform[9], this.worldTransform[10]]), i));
              j < 0 && (j = 0)
            }
            vec3.scale(b, j * j);
            var k = mat4.create();
            mat4.inverse(device.view, k), this.worldTransform[0] = k[0] * b, this.worldTransform[1] = k[1] * b, this.worldTransform[2] = k[2] * b, this.worldTransform[4] = k[4] * b, this.worldTransform[5] = k[5] * b, this.worldTransform[6] = k[6] * b, this.worldTransform[8] = k[8] * b, this.worldTransform[9] = k[9] * b, this.worldTransform[10] = k[10] * b;
            break;
          case this.EVE_CAMERA_ROTATION_ALIGNED:
          case this.EVE_SIMPLE_HALO:
            mat4.translate(a, this.translation, this.worldTransform);
            var f = vec3.create([this.worldTransform[12], this.worldTransform[13], this.worldTransform[14]]),
              g = device.GetEyePosition(),
              h = vec3.create();
            vec3.subtract(g, f, h);
            var l = mat4.create();
            mat4.transpose(a, l);
            var m = vec3.create(h);
            mat4.multiply3x3(l, m);
            var c = vec3.length([a[0], a[1], a[2]]);
            m[0] /= c;
            var d = vec3.length([a[4], a[5], a[6]]);
            m[1] /= d;
            var e = vec3.length([a[8], a[9], a[10]]);
            m[2] /= e;
            var n = vec3.length(m);
            vec3.normalize(m);
            var o = vec3.create([device.view[0], device.view[4], device.view[8]]);
            mat4.multiply3x3(l, o), vec3.normalize(o);
            var p = vec3.create();
            vec3.cross(m, o, p), vec3.normalize(p);
            var q = mat4.create();
            vec3.cross(p, m, o), q[0] = o[0], q[1] = o[1], q[2] = o[2], q[4] = p[0], q[5] = p[1], q[6] = p[2], q[8] = m[0], q[9] = m[1], q[10] = m[2], q[15] = 1, mat4.multiply(q, this.rotationTransform, q);
            if (this.modifier == this.EVE_SIMPLE_HALO) {
              var r = vec3.create();
              vec3.normalize(vec3.create([this.worldTransform[8], this.worldTransform[9], this.worldTransform[10]]), r);
              var s = vec3.create();
              vec3.normalize(h, s);
              var j = -vec3.dot(s, r);
              j < 0 && (j = 0), mat4.multiply(this.worldTransform, q, this.worldTransform), mat4.scale(this.worldTransform, [this.scaling[0] * j, this.scaling[1] * j, this.scaling[2] * j])
            } else mat4.scale(this.worldTransform, this.scaling), mat4.multiply(this.worldTransform, q, this.worldTransform);
            break;
          default:
            mat4.multiply(a, this.localTransform, this.worldTransform)
        }
        for (var t = 0; t < this.children.length; ++t) this.children[t].UpdateViewDependentData(this.worldTransform)
      };

      function EveTurretData() {
        this.visible = !0, this.localTransform = mat4.create()
      }

      function EveTurretSet() {
        this.name = "", this.boundingSphere = [0, 0, 0, 0], this.bottomClipHeight = 0, this.locatorName = "", this.turretEffect = null, this.geometryResPath = "", this.sysBoneHeight = 0, this.firingEffectResPath = "", this.firingEffect = null, this.display = !0, this.geometryResource = null, this.animation = new Tw2AnimationController, this.turrets = [], this.STATE_INACTIVE = 0, this.STATE_IDLE = 1, this.STATE_FIRING = 2, this.STATE_PACKING = 3, this.STATE_UNPACKING = 4, this.state = this.STATE_IDLE, this.targetPosition = vec3.create()
      }
      EveTurretSet.prototype.Initialize = function () {
        this.geometryResPath != "" && (this.geometryResource = resMan.GetResource(this.geometryResPath), this.animation.SetGeometryResource(this.geometryResource), this.geometryResource && this.geometryResource.RegisterNotification(this))
      }, EveTurretSet.prototype.RebuildCachedData = function (a) {
        switch (this.state) {
          case this.STATE_INACTIVE:
            this.animation.PlayAnimation("Inactive", !0);
            break;
          case this.STATE_IDLE:
            this.animation.PlayAnimation("Active", !0);
            break;
          case this.STATE_FIRING:
            this.animation.PlayAnimation("Fire", !0);
            break;
          case this.STATE_PACKING:
            this.EnterStateIdle();
            break;
          case this.STATE_UNPACKING:
            this.EnterStateDeactive()
        }
      }, EveTurretSet.prototype.SetLocalTransform = function (a, b) {
        if (a >= this.turrets.length) {
          var c = new EveTurretData;
          c.localTransform = b, this.turrets[a] = c
        } else this.turrets[a].localTransform = b
      }, EveTurretSet.prototype.GetBatches = function (a, b, c) {
        if (this.geometryResource == null || !this.display) return !1;
        if (a == device.RM_OPAQUE) {
          var d = new Tw2ForwardingRenderBatch;
          d.perObjectData = c, d.geometryProvider = this, b.Commit(d)
        }
        this.firingEffect && this.firingEffect.GetBatches(a, b, c);
        return !0
      }, EveTurretSet.prototype.Update = function (a) {
        this.animation.Update(a);
        if (this.firingEffect) {
          for (var b = 0; b < this.turrets.length; ++b) this.firingEffect.SetMuzzlePosition(b, [this.turrets[b].localTransform[12], this.turrets[b].localTransform[13], this.turrets[b].localTransform[14]]), this.firingEffect.SetTargetPosition(this.targetPosition);
          this.firingEffect.Update(a)
        }
      }, EveTurretSet.prototype.Render = function (a, b) {
        var c = typeof b == "undefined" ? this.turretEffect : b,
          d = device.perObjectData,
          e = d ? d.world : mat4.identity(mat4.create());
        for (var f = 0; f < this.turrets.length; ++f) {
          var g = this.animation.GetBoneMatrixes(0),
            h = mat4.create();
          mat4.multiply(e, this.turrets[f].localTransform, h), device.perObjectData = new Tw2SkinnedPerObjectData(g, h, d);
          var i = quat4.create([0, 1, 0, -this.bottomClipHeight]);
          mat4.multiplyVec4(mat4.transpose(mat4.inverse(h, mat4.create())), i), device.perObjectData.RegisterVariable("TurretClipPlane", i), this.geometryResource.RenderAreas(0, 0, 1, c)
        }
      }, EveTurretSet.prototype.EnterStateDeactive = function () {
        if (this.state != this.STATE_INACTIVE && this.state != this.STATE_PACKING) {
          var a = this;
          this.animation.StopAllAnimations(), this.animation.PlayAnimation("Pack", !1, function () {
            a.state = a.STATE_INACTIVE, a.animation.PlayAnimation("Inactive", !0)
          }), this.state = this.STATE_PACKING
        }
      }, EveTurretSet.prototype.EnterStateIdle = function () {
        if (this.state != this.STATE_IDLE && this.state != this.STATE_UNPACKING) {
          var a = this;
          this.animation.StopAllAnimations(), this.state == this.STATE_FIRING ? a.animation.PlayAnimation("Active", !0) : this.animation.PlayAnimation("Deploy", !1, function () {
            a.state = a.STATE_IDLE, a.animation.PlayAnimation("Active", !0)
          }), this.state = this.STATE_UNPACKING
        }
      }, EveTurretSet.prototype.EnterStateFiring = function () {
        if (this.state != this.STATE_FIRING) {
          var a = this;
          this.animation.StopAllAnimations(), this.state == this.STATE_INACTIVE ? (this.animation.PlayAnimation("Deploy", !1, function () {
            a.state = a.STATE_FIRING, a.Fire(), a.animation.PlayAnimation("Fire", !0, function () {
              a.Fire()
            })
          }), this.state = this.STATE_UNPACKING) : (a.state = a.STATE_FIRING, a.Fire(), a.animation.PlayAnimation("Fire", !0, function () {
            a.Fire()
          }))
        }
      }, EveTurretSet.prototype.ForceStateDeactive = function () {
        this.state != this.STATE_INACTIVE && (this.animation.StopAllAnimations(), this.animation.PlayAnimation("Inactive", !0), this.state = this.STATE_INACTIVE)
      }, EveTurretSet.prototype.ForceStateIdle = function () {
        this.state != this.STATE_IDLE && (this.animation.StopAllAnimations(), this.animation.PlayAnimation("Active", !0), this.state = this.STATE_IDLE)
      }, EveTurretSet.prototype.Fire = function () {
        this.firingEffect && this.firingEffect.Fire()
      };

      function EveSpaceObjectDecal() {
        this.display = !0, this.decalEffect = null, this.name = "", this.decalGeometryPath = "", this.decalIndex = 0, this.decalGeometry = null, this.position = vec3.create(), this.rotation = quat4.create(), this.scaling = vec3.create(), this.decalMatrix = mat4.create(), this.invDecalMatrix = mat4.create(), this.parentGeometry = null, variableStore.RegisterType("u_DecalMatrix", Tw2MatrixParameter), variableStore.RegisterType("u_InvDecalMatrix", Tw2MatrixParameter)
      }
      EveSpaceObjectDecal.prototype.Initialize = function () {
        this.decalGeometryPath != "" && (this.decalGeometry = resMan.GetResource(this.decalGeometryPath)), mat4.scale(mat4.transpose(quat4.toMat4(this.rotation, this.decalMatrix)), this.scaling), this.decalMatrix[12] = this.position[0], this.decalMatrix[13] = this.position[1], this.decalMatrix[14] = this.position[2], mat4.inverse(this.decalMatrix, this.invDecalMatrix)
      }, EveSpaceObjectDecal.prototype.SetParentGeometry = function (a) {
        this.parentGeometry = a
      }, EveSpaceObjectDecal.prototype.GetBatches = function (a, b, c) {
        if (a == device.RM_DECAL && this.display && this.decalEffect && this.parentGeometry && this.parentGeometry.IsGood() && this.decalGeometry && this.decalGeometry.IsGood()) {
          var d = new Tw2ForwardingRenderBatch;
          d.perObjectData = c, d.geometryProvider = this, d.renderMode = device.RM_DECAL, b.Commit(d)
        }
      }, EveSpaceObjectDecal.prototype.Render = function (a, b) {
        var c = this.parentGeometry.meshes[0].indexes,
          d = this.parentGeometry.meshes[0].areas[0].start,
          e = this.parentGeometry.meshes[0].areas[0].count;
        mat4.set(this.decalMatrix, variableStore._variables.u_DecalMatrix.value), mat4.set(this.invDecalMatrix, variableStore._variables.u_InvDecalMatrix.value), this.parentGeometry.meshes[0].indexes = this.decalGeometry.meshes[this.decalIndex].indexes, this.parentGeometry.meshes[0].areas[0].start = this.decalGeometry.meshes[this.decalIndex].areas[0].start, this.parentGeometry.meshes[0].areas[0].count = this.decalGeometry.meshes[this.decalIndex].areas[0].count, this.parentGeometry.RenderAreas(0, 0, 1, b ? b : this.decalEffect), this.parentGeometry.meshes[0].indexes = c, this.parentGeometry.meshes[0].areas[0].start = d, this.parentGeometry.meshes[0].areas[0].count = e
      };

      function EveShip() {
        this.name = "", this.mesh = null, this.spriteSets = [], this.boundingSphereCenter = vec3.create(), this.boundingSphereRadius = 0, this.boosterGain = 1, this.boosters = null, this.locators = [], this.turretSets = [], this.decals = [], this.transform = mat4.create(), mat4.identity(this.transform), this.children = [], this._turretSetsLocatorInfo = [], this.animation = new Tw2AnimationController
      }

      function EveTurretSetLocatorInfo() {
        this.isJoint = !1, this.locatorTransforms = []
      }
      EveShip.prototype.Initialize = function () {
        if (this.mesh) {
          this.animation.SetGeometryResource(this.mesh.geometryResource);
          for (var a = 0; a < this.decals.length; ++a) this.decals[a].SetParentGeometry(this.mesh.geometryResource)
        }
      }, EveShip.prototype.GetBatches = function (a, b) {
        for (var c = 0; c < this.children.length; ++c) this.children[c].UpdateViewDependentData(this.transform);
        var d = null;
        this.animation.animations.length ? (d = new Tw2SkinnedPerObjectData(this.animation.GetBoneMatrixes(0), this.transform), d.world = this.transform) : (d = new Tw2PerObjectData, d.world = this.transform), d.RegisterVariableWithType("u_BoosterGain", this.boosterGain, Tw2FloatParameter), this.mesh != null && this.mesh.GetBatches(a, b, d);
        for (var c = 0; c < this.spriteSets.length; ++c) this.spriteSets[c].GetBatches(a, b, d);
        for (var c = 0; c < this.children.length; ++c) this.children[c].GetBatches(a, b);
        for (var c = 0; c < this.turretSets.length; ++c) this.turretSets[c].GetBatches(a, b, d);
        for (var c = 0; c < this.decals.length; ++c) this.decals[c].GetBatches(a, b, d);
        this.boosters && this.boosters.GetBatches(a, b, d)
      }, EveShip.prototype.Update = function (a) {
        for (var b = 0; b < this.spriteSets.length; ++b) this.spriteSets[b].Update(a);
        this.boosters && (this.boosters.rebuildPending && this.RebuildBoosterSet(), this.boosters.Update(a, this.transform));
        for (var b = 0; b < this.children.length; ++b) this.children[b].Update(a);
        this.animation.Update(a);
        for (var b = 0; b < this.turretSets.length; ++b) {
          if (b < this._turretSetsLocatorInfo.length && this._turretSetsLocatorInfo[b].isJoint) for (var c = 0; c < this._turretSetsLocatorInfo[b].locatorTransforms.length; ++c) this.turretSets[b].SetLocalTransform(c, this._turretSetsLocatorInfo[b].locatorTransforms[c]);
          this.turretSets[b].Update(a)
        }
      }, EveShip.prototype.RebuildBoosterSet = function () {
        if ( !! this.boosters) {
          this.boosters.Clear();
          var a = "locator_booster";
          for (var b = 0; b < this.locators.length; ++b) this.locators[b].name.substr(0, a.length) == a && this.boosters.Add(this.locators[b].transform);
          this.boosters.Rebuild()
        }
      }, EveShip.prototype.RebuildTurretPositions = function () {
        this._turretSetsLocatorInfo = [];
        for (var a = 0; a < this.turretSets.length; ++a) {
          var b = this.turretSets[a].locatorName,
            c = this.GetLocatorCount(b),
            d = new EveTurretSetLocatorInfo;
          for (var e = 0; e < c; ++e) {
            var f = b + String.fromCharCode("a".charCodeAt(0) + e),
              g = this.FindLocatorJointByName(f);
            g != null ? d.isJoint = !0 : g = this.FindLocatorTransformByName(f), g != null && (this.turretSets[a].SetLocalTransform(e, g), d.locatorTransforms[d.locatorTransforms.length] = g)
          }
          this._turretSetsLocatorInfo[this._turretSetsLocatorInfo.length] = d
        }
      }, EveShip.prototype.GetLocatorCount = function (a) {
        var b = 0;
        for (var c = 0; c < this.locators.length; ++c) this.locators[c].name.substr(0, a.length) == a && ++b;
        return b
      }, EveShip.prototype.FindLocatorJointByName = function (a) {
        var b = this.animation.FindModelForMesh(0);
        if (b != null) for (var c = 0; c < b.bones.length; ++c) if (b.bones[c].boneRes.name == a) return b.bones[c].worldTransform;
        return null
      }, EveShip.prototype.FindLocatorTransformByName = function (a) {
        for (var b = 0; b < this.locators.length; ++b) if (this.locators[b].name == a) return this.locators[b].transform;
        return null
      }, EveShip.prototype.RenderDebugInfo = function (a) {
        this.animation.RenderDebugInfo(a)
      };

      function EveSpaceScene() {
        this.objects = [], this.sky = null, this.envMap1ResPath = "", this.envMap2ResPath = "", this.envMap3ResPath = "", this.envMap1Res = null, this.envMap2Res = null, this.envMap3Res = null, this._envMap1Handle = variableStore.RegisterVariable("EnvMap1", ""), this._envMap2Handle = variableStore.RegisterVariable("EnvMap2", ""), this._envMap3Handle = variableStore.RegisterVariable("EnvMap3", ""), variableStore.RegisterType("u_sunDirection", Tw2Vector3Parameter), variableStore.RegisterType("u_sunColor", Tw2Vector3Parameter), variableStore.RegisterType("u_ambientColor", Tw2Vector3Parameter), this.renderDebugInfo = !1, this._debugHelper = null, this._batches = new Tw2BatchAccumulator, this.sunDirection = vec3.create([1, 1, 1]), this.sunColor = vec3.create([1, 1, 1]), this.ambientColor = vec3.create([.1, .1, .1])
      }
      EveSpaceScene.prototype.Initialize = function () {
        this.envMap1ResPath != "" && (this.envMap1Res = resMan.GetResource(this.envMap1ResPath)), this.envMap2ResPath != "" && (this.envMap2Res = resMan.GetResource(this.envMap2ResPath)), this.envMap3ResPath != "" && (this.envMap3Res = resMan.GetResource(this.envMap3ResPath))
      }, EveSpaceScene.prototype.SetEnvMapPath = function (a, b) {
        switch (a) {
          case 0:
            this.envMap1ResPath = b, this.envMap1ResPath != "" ? this.envMap1Res = resMan.GetResource(this.envMap1ResPath) : this.envMap1Res = null;
            break;
          case 1:
            this.envMap2ResPath = b, this.envMap2ResPath != "" ? this.envMap2Res = resMan.GetResource(this.envMap2ResPath) : this.envMap2Res = null;
            break;
          case 2:
            this.envMap3ResPath = b, this.envMap3ResPath != "" ? this.envMap3Res = resMan.GetResource(this.envMap3ResPath) : this.envMap3Res = null
        }
      }, EveSpaceScene.prototype.RenderBatches = function (a) {
        for (var b = 0; b < this.objects.length; ++b) typeof this.objects[b].GetBatches != "undefined" && this.objects[b].GetBatches(a, this._batches)
      }, EveSpaceScene.prototype.Render = function () {
        var a = vec3.create(this.sunDirection);
        vec3.normalize(a), variableStore._variables.u_sunDirection.value.set(a), variableStore._variables.u_sunColor.value.set(this.sunColor), variableStore._variables.u_ambientColor.value.set(this.ambientColor), this._envMap1Handle.textureRes = this.envMap1Res, this._envMap2Handle.textureRes = this.envMap2Res, this._envMap3Handle.textureRes = this.envMap3Res, this.sky && this.sky.Render();
        for (var b = 0; b < this.objects.length; ++b) typeof this.objects[b].ViewDependentUpdate != "undefined" && this.objects[b].ViewDependentUpdate();
        this._batches.Clear(), this.RenderBatches(device.RM_OPAQUE), this.RenderBatches(device.RM_DECAL), this.RenderBatches(device.RM_TRANSPARENT), this.RenderBatches(device.RM_ADDITIVE), this._batches.Render();
        if (this.renderDebugInfo) {
          this._debugHelper == null && (this._debugHelper = new Tw2DebugRenderer);
          for (var b = 0; b < this.objects.length; ++b) typeof this.objects[b].RenderDebugInfo != "undefined" && this.objects[b].RenderDebugInfo(this._debugHelper);
          this._debugHelper.Render()
        }
      }, EveSpaceScene.prototype.Update = function (a) {
        for (var b = 0; b < this.objects.length; ++b) typeof this.objects[b].Update != "undefined" && this.objects[b].Update(a)
      }
    }
    TestCamera.prototype.GetView = function () {
      var a = mat4.create();
      mat4.identity(a), mat4.translate(a, [0, 0, -this.currDistance]), mat4.rotateX(a, -this.rotationX), mat4.rotateY(a, this.rotationY), ship != null && (mat4.rotateX(ship.transform, Math.cos(pitchWave += .001) / 15e3 - Math.cos(pitchSmallWave += .005) / 2e4), mat4.rotateZ(ship.transform, Math.cos(rollWave += .001) / 15e3 - Math.cos(rollSmallWave += .005) / 2e4));
      return a
    }, TestCamera.prototype.GetProjection = function () {
      var a = mat4.create();
      mat4.perspective(this.fov, device.gl.viewportWidth / device.gl.viewportHeight, 1, this.currDistance * 2, a);
      return a
    }, TestCamera.prototype.Update = function (a) {
      if (this.currDistance != this.distance) {
        var b = this.currDistance - this.distance;
        this.currDistance -= b / 4
      }
      ref.phiDiff != 0 && (ref.cameraChanged = !0, ref.phiDiff *= .82, ref.phi -= ref.phiDiff, ref.phiDiff < .001 && ref.phiDiff > -0.001 && (ref.phiDiff = 0)), ref.thetaDiff != 0 && (ref.cameraChanged = !0, ref.thetaDiff *= .82, ref.theta -= ref.thetaDiff, ref.thetaDiff < .001 && ref.thetaDiff > -0.001 && (ref.thetaDiff = 0)), doAnimation ? this.rotationY += .005 : (this.rotationX += ref.phiDiff, this.rotationY += ref.thetaDiff, this.rotationX > 1.6 ? this.rotationX = 1.6 : this.rotationX < -1.6 && (this.rotationX = -1.6))
    }, TestCamera.prototype.AddRadius = function (a) {
      this.distance -= a * ship.boundingSphereRadius / 300, this.distance < minZoomDistance ? this.distance = minZoomDistance : this.distance > minZoomDistance * 10 && (this.distance = minZoomDistance * 10)
    }, TestCamera.prototype.onDocumentMouseWheel = function (a, b) {
      a.preventDefault(), a.returnValue = !1, a.cancelBubble = !0, isNaN(a.wheelDeltaY) || this.AddRadius(a.wheelDeltaY)
    }, TestCamera.prototype.handleWheel = function (a, b) {
      a.preventDefault(), a.returnValue = !1, a.cancelBubble = !0;
      var c = 0;
      a || (a = window.event), a.wheelDelta ? c = a.wheelDelta : a.detail && (c = a.detail), c < 120 && c > 0 ? c = -120 : c < 0 && c > -120 && (c = 120), this.AddRadius(c)
    }, CCPShipViewer.prototype.afterShipLoaded = function () {
      loadingShip = !1;
      var a = document.getElementById(ref.containerId);
      if (a != undefined) {
        var b = document.getElementById("Loading_" + ref.containerId);
        b != undefined && a.removeChild(b)
      }
      settings.afterShipChanged && settings.afterShipChanged(ref.selectedShipFact)
    }, CCPShipViewer.prototype.onFallbackImageError = function () {
      var a = document.getElementById("fallbackImage");
      a != undefined && document.getElementById(ref.containerId).removeChild(a), ref.afterShipLoaded()
    }, CCPShipViewer.prototype.onFallbackImageLoaded = function (a) {
      var b = document.getElementById("fallbackImage");
      b != undefined && document.getElementById(ref.containerId).removeChild(b), document.getElementById(ref.containerId).appendChild(a), ref.afterShipLoaded()
    };
    var modules = ["defensive", "engineering", "offensive", "propulsion"];
    CCPShipViewer.prototype.selectShip = function (a) {
      SelectShip(a)
    }, CCPShipViewer.prototype.getShipList = function () {
      return CCPShipFactList
    }, CCPShipViewer.prototype.getResource = function (a) {
      ShipViewerLoadingResources = !0, ref.pendingResources++, ref.JSONP.get(a, {}, null)
    }, CCPShipViewer.prototype.onResourceLoaded = function () {
      ref.pendingResources--;
      if (ref.pendingResources == 0) {
        ShipViewerLoadingResources = !1;
        for (var a = 0; a < ShipViewerWaitingList.length; a++) ShipViewerWaitingList[a].resourcesLoaded || ShipViewerWaitingList[a].onAllResourcesLoaded();
        ShipViewerWaitingList = []
      }
    }, CCPShipViewer.prototype.onAllResourcesLoaded = function () {
      ref.resourcesLoaded = !0, ref.container.style.width = ref.width + "px", ref.container.clientHeight == 0 && (ref.container.style.height = ref.height + "px");
      if (ref.isWebGL) {
        var a = document.createElement("canvas");
        a.width = ref.width, a.height = ref.height, a.id = "canvas_" + ref.containerId, camera = new TestCamera(a);
        if (showFPS) {
          var b = document.createElement("div");
          b.style.height = "22px", b.style.color = "#FFF", b.style.background = "#000", b.id = ref.containerId + "_FPS", ref.container.appendChild(b)
        }
        ref.container.appendChild(a), ref.container.addEventListener("mousedown", ref.onMouseDown, !1), device.CreateDevice(a), device.mipLevelSkipCount = quality;
        var c = vec3.create([1, 1, 1]);
        vec3.normalize(c), variableStore._variables.u_sunDirection = new Tw2Vector3Parameter("u_sunDirection", c), variableStore._variables.u_sunColor = new Tw2Vector3Parameter("u_sunColor", vec3.create([1, 1, 1])), variableStore._variables.u_ambientColor = new Tw2Vector3Parameter("u_ambientColor", vec3.create([.1, .1, .1])), scene = new EveSpaceScene, postprocess = new Tw2PostProcess, device.Schedule(Render), tick()
      }
      var d = document.getElementById(ref.containerId);
      d != undefined && d.removeChild(document.getElementById("Loading_" + ref.containerId));
      if (settings.onLoaded) {
        var e = ref.getRenderType();
        settings.onLoaded({
          renderType: e
        })
      }
      defaultShip != "" && SelectShip(defaultShip)
    }, CCPShipViewer.prototype.getRenderType = function () {
      return ref.isWebGL ? "webgl" : "static image"
    }, CCPShipViewer.prototype.MaximizeCanvas = function () {
      var a = document.getElementById("canvas_" + ref.containerId);
      restoreIndex = a.style.zIndex || 0, restorePosition = a.style.position, restoreLeft = a.style.left, restoreTop = a.style.top, restoreWidth = a.style.width || a.clientWidth, restoreHeight = a.style.height || a.clientHeight, a.style.position = "fixed", a.style.left = "0px", a.style.top = "0", a.style.width = "100%", a.style.height = "100%", a.style.zIndex = 200, a.width = a.clientWidth, a.height = a.clientHeight, device.gl.viewportWidth = a.clientWidth, device.gl.viewportHeight = a.clientHeight, window.addEventListener("resize", ref.onCanvasResize, !1)
    }, CCPShipViewer.prototype.RestoreCanvas = function () {
      var a = document.getElementById("canvas_" + ref.containerId);
      a.style.zIndex = restoreIndex, a.style.position = restorePosition, a.style.left = restoreLeft, a.style.top = restoreTop, a.style.width = restoreWidth, a.style.height = restoreHeight, a.width = a.clientWidth, a.height = a.clientHeight, device.gl.viewportWidth = a.clientWidth, device.gl.viewportHeight = a.clientHeight, window.removeEventListener("resize", ref.onCanvasResize, !1)
    }, CCPShipViewer.prototype.onCanvasResize = function () {
      var a = document.getElementById("canvas_" + ref.containerId);
      a.width = a.clientWidth, a.height = a.clientHeight, device.gl.viewportWidth = a.clientWidth, device.gl.viewportHeight = a.clientHeight
    }, CCPShipViewer.prototype.init = function (a) {
      ref.containerId = a, ref.container = document.getElementById(ref.containerId);
      var b = document.createElement("div");
      b.id = "Loading_" + ref.containerId, b.className = "CCPShipViewerLoading", b.innerHTML = "Loading Shipviewer", ref.container.appendChild(b), b = null, ref.pendingResources = 0, ShipViewerLoadingResources || (CCPShipFactList != undefined && CCPShipResourceList != undefined ? ref.onAllResourcesLoaded() : (window.CCPShipResources = function (a) {
        CCPShipResourceList = a, ref.onResourceLoaded()
      }, window.CCPShipFacts = function (a) {
        CCPShipFactList = a, ref.onResourceLoaded()
      }, ref.getResource(ref.assetsPath + ref.shipResourceFileName), ref.getResource(ref.assetsPath + ref.shipFactsFileName))), ShipViewerWaitingList.push(ref)
    }, CCPShipViewer.prototype.onMouseUp = function (a) {
      a.preventDefault(), ref.isMouseDown = !1, document.removeEventListener("mousemove", ref.onMouseMove, !1), document.removeEventListener("mouseup", ref.onMouseUp, !1)
    }, CCPShipViewer.prototype.onMouseDown = function (a) {
      a.preventDefault(), ref.isMouseDown = !0, onMouseDownPosition[0] = a.clientX, onMouseDownPosition[1] = a.clientY, ref.onMouseDownTheta = ref.theta, ref.onMouseDownPhi = ref.phi, ref.lastPhi = ref.phi, ref.lastTheta = ref.theta, doAnimation = !1, document.addEventListener("mousemove", ref.onMouseMove, !1), document.addEventListener("mouseup", ref.onMouseUp, !1)
    }, CCPShipViewer.prototype.onMouseMove = function (a) {
      if (ref.isMouseDown) {
        var b = -((a.clientX - onMouseDownPosition[0]) * .01) + ref.onMouseDownTheta,
          c = (a.clientY - onMouseDownPosition[1]) * .01 + ref.onMouseDownPhi;
        c = Math.min(179, Math.max(-179, c)), ref.phiDiff += (ref.lastPhi - c) / 4, ref.thetaDiff += (ref.lastTheta - b) / 4, ref.lastPhi = c, ref.lastTheta = b
      }
    }, CCPShipViewer.prototype.createHttpRequest = function () {
      var a = null;
      if (window.XMLHttpRequest) a = new XMLHttpRequest;
      else if (window.ActiveXObject) try {
        a = new ActiveXObject("Msxml2.XMLHTTP")
      } catch (b) {
        try {
          a = new ActiveXObject("Microsoft.XMLHTTP")
        } catch (b) {}
      }
      a || log.LogErr("CCP Shipviewer: could not create an XMLHTTP instance");
      return a
    }, CCPShipViewer.prototype.JSONP = function () {
      function g(b, g, h, i) {
        c = "?", g = g || {};
        for (d in g) g.hasOwnProperty(d) && (c += encodeURIComponent(d) + "=" + encodeURIComponent(g[d]) + "&");
        var j = "json_" + ++a;
        e[j] = function (a) {
          h(a);
          try {
            delete e[j]
          } catch (b) {}
          e[j] = null
        }, f(b);
        return j
      }

      function f(a) {
        var c = document.createElement("script"),
          d = !1;
        c.src = a, c.async = !0, c.onload = c.onreadystatechange = function () {
          !d && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") && (d = !0, c.onload = c.onreadystatechange = null, c && c.parentNode && c.parentNode.removeChild(c))
        }, b || (b = document.getElementsByTagName("head")[0]), b.appendChild(c)
      }
      var a = 0,
        b, c, d, e = this;
      return {
        get: g
      }
    }(), window.requestAnimFrame = function () {
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (a, b) {
        window.setTimeout(a, 1e3 / 60)
      }
    }(), this.init(settings.parentElementId)
  }
}

function checkWebGLSupport() {
  if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {
    var a = new Number(RegExp.$1);
    if (a < 8) return !1
  }
  if ( !! window.WebGLRenderingContext == !1) return !1;
  var b = !1;
  try {
    var c = document.createElement("canvas");
    b = !(!window.WebGLRenderingContext || !c.getContext("experimental-webgl") && !c.getContext("webgl")), c = undefined
  } catch (d) {
    b = !1
  }
  return b
}
var ShipViewerWaitingList, ShipViewerLoadingResources, CCPShipResourceList, CCPShipFactList;
glMatrixArrayType = typeof Float32Array != "undefined" ? Float32Array : typeof WebGLFloatArray != "undefined" ? WebGLFloatArray : Array;
var vec3 = {};
vec3.create = function (a) {
  var b = new glMatrixArrayType(3);
  a && (b[0] = a[0], b[1] = a[1], b[2] = a[2]);
  return b
}, vec3.set = function (a, b) {
  b[0] = a[0], b[1] = a[1], b[2] = a[2];
  return b
}, vec3.add = function (a, b, c) {
  if (!c || a == c) {
    a[0] += b[0], a[1] += b[1], a[2] += b[2];
    return a
  }
  c[0] = a[0] + b[0], c[1] = a[1] + b[1], c[2] = a[2] + b[2];
  return c
}, vec3.subtract = function (a, b, c) {
  if (!c || a == c) {
    a[0] -= b[0], a[1] -= b[1], a[2] -= b[2];
    return a
  }
  c[0] = a[0] - b[0], c[1] = a[1] - b[1], c[2] = a[2] - b[2];
  return c
}, vec3.negate = function (a, b) {
  b || (b = a), b[0] = -a[0], b[1] = -a[1], b[2] = -a[2];
  return b
}, vec3.scale = function (a, b, c) {
  if (!c || a == c) {
    a[0] *= b, a[1] *= b, a[2] *= b;
    return a
  }
  c[0] = a[0] * b, c[1] = a[1] * b, c[2] = a[2] * b;
  return c
}, vec3.normalize = function (a, b) {
  b || (b = a);
  var c = a[0],
    d = a[1],
    e = a[2],
    f = Math.sqrt(c * c + d * d + e * e);
  if (!f) {
    b[0] = 0, b[1] = 0, b[2] = 0;
    return b
  }
  if (f == 1) {
    b[0] = c, b[1] = d, b[2] = e;
    return b
  }
  f = 1 / f, b[0] = c * f, b[1] = d * f, b[2] = e * f;
  return b
}, vec3.cross = function (a, b, c) {
  c || (c = a);
  var d = a[0],
    e = a[1];
  a = a[2];
  var f = b[0],
    g = b[1];
  b = b[2], c[0] = e * b - a * g, c[1] = a * f - d * b, c[2] = d * g - e * f;
  return c
}, vec3.length = function (a) {
  var b = a[0],
    c = a[1];
  a = a[2];
  return Math.sqrt(b * b + c * c + a * a)
}, vec3.dot = function (a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}, vec3.direction = function (a, b, c) {
  c || (c = a);
  var d = a[0] - b[0],
    e = a[1] - b[1];
  a = a[2] - b[2], b = Math.sqrt(d * d + e * e + a * a);
  if (!b) {
    c[0] = 0, c[1] = 0, c[2] = 0;
    return c
  }
  b = 1 / b, c[0] = d * b, c[1] = e * b, c[2] = a * b;
  return c
}, vec3.lerp = function (a, b, c, d) {
  d || (d = a), d[0] = a[0] + c * (b[0] - a[0]), d[1] = a[1] + c * (b[1] - a[1]), d[2] = a[2] + c * (b[2] - a[2]);
  return d
}, vec3.str = function (a) {
  return "[" + a[0] + ", " + a[1] + ", " + a[2] + "]"
};
var mat3 = {};
mat3.create = function (a) {
  var b = new glMatrixArrayType(9);
  a && (b[0] = a[0], b[1] = a[1], b[2] = a[2], b[3] = a[3], b[4] = a[4], b[5] = a[5], b[6] = a[6], b[7] = a[7], b[8] = a[8], b[9] = a[9]);
  return b
}, mat3.set = function (a, b) {
  b[0] = a[0], b[1] = a[1], b[2] = a[2], b[3] = a[3], b[4] = a[4], b[5] = a[5], b[6] = a[6], b[7] = a[7], b[8] = a[8];
  return b
}, mat3.identity = function (a) {
  a[0] = 1, a[1] = 0, a[2] = 0, a[3] = 0, a[4] = 1, a[5] = 0, a[6] = 0, a[7] = 0, a[8] = 1;
  return a
}, mat3.transpose = function (a, b) {
  if (!b || a == b) {
    var c = a[1],
      d = a[2],
      e = a[5];
    a[1] = a[3], a[2] = a[6], a[3] = c, a[5] = a[7], a[6] = d, a[7] = e;
    return a
  }
  b[0] = a[0], b[1] = a[3], b[2] = a[6], b[3] = a[1], b[4] = a[4], b[5] = a[7], b[6] = a[2], b[7] = a[5], b[8] = a[8];
  return b
}, mat3.toMat4 = function (a, b) {
  b || (b = mat4.create()), b[0] = a[0], b[1] = a[1], b[2] = a[2], b[3] = 0, b[4] = a[3], b[5] = a[4], b[6] = a[5], b[7] = 0, b[8] = a[6], b[9] = a[7], b[10] = a[8], b[11] = 0, b[12] = 0, b[13] = 0, b[14] = 0, b[15] = 1;
  return b
}, mat3.str = function (a) {
  return "[" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + "]"
};
var mat4 = {};
mat4.create = function (a) {
  var b = new glMatrixArrayType(16);
  a && (b[0] = a[0], b[1] = a[1], b[2] = a[2], b[3] = a[3], b[4] = a[4], b[5] = a[5], b[6] = a[6], b[7] = a[7], b[8] = a[8], b[9] = a[9], b[10] = a[10], b[11] = a[11], b[12] = a[12], b[13] = a[13], b[14] = a[14], b[15] = a[15]);
  return b
}, mat4.set = function (a, b) {
  b[0] = a[0], b[1] = a[1], b[2] = a[2], b[3] = a[3], b[4] = a[4], b[5] = a[5], b[6] = a[6], b[7] = a[7], b[8] = a[8], b[9] = a[9], b[10] = a[10], b[11] = a[11], b[12] = a[12], b[13] = a[13], b[14] = a[14], b[15] = a[15];
  return b
}, mat4.identity = function (a) {
  a[0] = 1, a[1] = 0, a[2] = 0, a[3] = 0, a[4] = 0, a[5] = 1, a[6] = 0, a[7] = 0, a[8] = 0, a[9] = 0, a[10] = 1, a[11] = 0, a[12] = 0, a[13] = 0, a[14] = 0, a[15] = 1;
  return a
}, mat4.transpose = function (a, b) {
  if (!b || a == b) {
    var c = a[1],
      d = a[2],
      e = a[3],
      f = a[6],
      g = a[7],
      h = a[11];
    a[1] = a[4], a[2] = a[8], a[3] = a[12], a[4] = c, a[6] = a[9], a[7] = a[13], a[8] = d, a[9] = f, a[11] = a[14], a[12] = e, a[13] = g, a[14] = h;
    return a
  }
  b[0] = a[0], b[1] = a[4], b[2] = a[8], b[3] = a[12], b[4] = a[1], b[5] = a[5], b[6] = a[9], b[7] = a[13], b[8] = a[2], b[9] = a[6], b[10] = a[10], b[11] = a[14], b[12] = a[3], b[13] = a[7], b[14] = a[11], b[15] = a[15];
  return b
}, mat4.determinant = function (a) {
  var b = a[0],
    c = a[1],
    d = a[2],
    e = a[3],
    f = a[4],
    g = a[5],
    h = a[6],
    i = a[7],
    j = a[8],
    k = a[9],
    l = a[10],
    m = a[11],
    n = a[12],
    o = a[13],
    p = a[14];
  a = a[15];
  return n * k * h * e - j * o * h * e - n * g * l * e + f * o * l * e + j * g * p * e - f * k * p * e - n * k * d * i + j * o * d * i + n * c * l * i - b * o * l * i - j * c * p * i + b * k * p * i + n * g * d * m - f * o * d * m - n * c * h * m + b * o * h * m + f * c * p * m - b * g * p * m - j * g * d * a + f * k * d * a + j * c * h * a - b * k * h * a - f * c * l * a + b * g * l * a
}, mat4.inverse = function (a, b) {
  b || (b = a);
  var c = a[0],
    d = a[1],
    e = a[2],
    f = a[3],
    g = a[4],
    h = a[5],
    i = a[6],
    j = a[7],
    k = a[8],
    l = a[9],
    m = a[10],
    n = a[11],
    o = a[12],
    p = a[13],
    q = a[14],
    r = a[15],
    s = c * h - d * g,
    t = c * i - e * g,
    u = c * j - f * g,
    v = d * i - e * h,
    w = d * j - f * h,
    x = e * j - f * i,
    y = k * p - l * o,
    z = k * q - m * o,
    A = k * r - n * o,
    B = l * q - m * p,
    C = l * r - n * p,
    D = m * r - n * q,
    E = 1 / (s * D - t * C + u * B + v * A - w * z + x * y);
  b[0] = (h * D - i * C + j * B) * E, b[1] = (-d * D + e * C - f * B) * E, b[2] = (p * x - q * w + r * v) * E, b[3] = (-l * x + m * w - n * v) * E, b[4] = (-g * D + i * A - j * z) * E, b[5] = (c * D - e * A + f * z) * E, b[6] = (-o * x + q * u - r * t) * E, b[7] = (k * x - m * u + n * t) * E, b[8] = (g * C - h * A + j * y) * E, b[9] = (-c * C + d * A - f * y) * E, b[10] = (o * w - p * u + r * s) * E, b[11] = (-k * w + l * u - n * s) * E, b[12] = (-g * B + h * z - i * y) * E, b[13] = (c * B - d * z + e * y) * E, b[14] = (-o * v + p * t - q * s) * E, b[15] = (k * v - l * t + m * s) * E;
  return b
}, mat4.toRotationMat = function (a, b) {
  b || (b = mat4.create()), b[0] = a[0], b[1] = a[1], b[2] = a[2], b[3] = a[3], b[4] = a[4], b[5] = a[5], b[6] = a[6], b[7] = a[7], b[8] = a[8], b[9] = a[9], b[10] = a[10], b[11] = a[11], b[12] = 0, b[13] = 0, b[14] = 0, b[15] = 1;
  return b
}, mat4.toMat3 = function (a, b) {
  b || (b = mat3.create()), b[0] = a[0], b[1] = a[1], b[2] = a[2], b[3] = a[4], b[4] = a[5], b[5] = a[6], b[6] = a[8], b[7] = a[9], b[8] = a[10];
  return b
}, mat4.toInverseMat3 = function (a, b) {
  var c = a[0],
    d = a[1],
    e = a[2],
    f = a[4],
    g = a[5],
    h = a[6],
    i = a[8],
    j = a[9],
    k = a[10],
    l = k * g - h * j,
    m = -k * f + h * i,
    n = j * f - g * i,
    o = c * l + d * m + e * n;
  if (!o) return null;
  o = 1 / o, b || (b = mat3.create()), b[0] = l * o, b[1] = (-k * d + e * j) * o, b[2] = (h * d - e * g) * o, b[3] = m * o, b[4] = (k * c - e * i) * o, b[5] = (-h * c + e * f) * o, b[6] = n * o, b[7] = (-j * c + d * i) * o, b[8] = (g * c - d * f) * o;
  return b
}, mat4.multiply = function (a, b, c) {
  c || (c = a);
  var d = a[0],
    e = a[1],
    f = a[2],
    g = a[3],
    h = a[4],
    i = a[5],
    j = a[6],
    k = a[7],
    l = a[8],
    m = a[9],
    n = a[10],
    o = a[11],
    p = a[12],
    q = a[13],
    r = a[14];
  a = a[15];
  var s = b[0],
    t = b[1],
    u = b[2],
    v = b[3],
    w = b[4],
    x = b[5],
    y = b[6],
    z = b[7],
    A = b[8],
    B = b[9],
    C = b[10],
    D = b[11],
    E = b[12],
    F = b[13],
    G = b[14];
  b = b[15], c[0] = s * d + t * h + u * l + v * p, c[1] = s * e + t * i + u * m + v * q, c[2] = s * f + t * j + u * n + v * r, c[3] = s * g + t * k + u * o + v * a, c[4] = w * d + x * h + y * l + z * p, c[5] = w * e + x * i + y * m + z * q, c[6] = w * f + x * j + y * n + z * r, c[7] = w * g + x * k + y * o + z * a, c[8] = A * d + B * h + C * l + D * p, c[9] = A * e + B * i + C * m + D * q, c[10] = A * f + B * j + C * n + D * r, c[11] = A * g + B * k + C * o + D * a, c[12] = E * d + F * h + G * l + b * p, c[13] = E * e + F * i + G * m + b * q, c[14] = E * f + F * j + G * n + b * r, c[15] = E * g + F * k + G * o + b * a;
  return c
}, mat4.multiplyVec3 = function (a, b, c) {
  c || (c = b);
  var d = b[0],
    e = b[1];
  b = b[2], c[0] = a[0] * d + a[4] * e + a[8] * b + a[12], c[1] = a[1] * d + a[5] * e + a[9] * b + a[13], c[2] = a[2] * d + a[6] * e + a[10] * b + a[14];
  return c
}, mat4.multiplyVec4 = function (a, b, c) {
  c || (c = b);
  var d = b[0],
    e = b[1],
    f = b[2];
  b = b[3], c[0] = a[0] * d + a[4] * e + a[8] * f + a[12] * b, c[1] = a[1] * d + a[5] * e + a[9] * f + a[13] * b, c[2] = a[2] * d + a[6] * e + a[10] * f + a[14] * b, c[3] = a[3] * d + a[7] * e + a[11] * f + a[15] * b;
  return c
}, mat4.translate = function (a, b, c) {
  var d = b[0],
    e = b[1];
  b = b[2];
  if (!c || a == c) {
    a[12] = a[0] * d + a[4] * e + a[8] * b + a[12], a[13] = a[1] * d + a[5] * e + a[9] * b + a[13], a[14] = a[2] * d + a[6] * e + a[10] * b + a[14], a[15] = a[3] * d + a[7] * e + a[11] * b + a[15];
    return a
  }
  var f = a[0],
    g = a[1],
    h = a[2],
    i = a[3],
    j = a[4],
    k = a[5],
    l = a[6],
    m = a[7],
    n = a[8],
    o = a[9],
    p = a[10],
    q = a[11];
  c[0] = f, c[1] = g, c[2] = h, c[3] = i, c[4] = j, c[5] = k, c[6] = l, c[7] = m, c[8] = n, c[9] = o, c[10] = p, c[11] = q, c[12] = f * d + j * e + n * b + a[12], c[13] = g * d + k * e + o * b + a[13], c[14] = h * d + l * e + p * b + a[14], c[15] = i * d + m * e + q * b + a[15];
  return c
}, mat4.scale = function (a, b, c) {
  var d = b[0],
    e = b[1];
  b = b[2];
  if (!c || a == c) {
    a[0] *= d, a[1] *= d, a[2] *= d, a[3] *= d, a[4] *= e, a[5] *= e, a[6] *= e, a[7] *= e, a[8] *= b, a[9] *= b, a[10] *= b, a[11] *= b;
    return a
  }
  c[0] = a[0] * d, c[1] = a[1] * d, c[2] = a[2] * d, c[3] = a[3] * d, c[4] = a[4] * e, c[5] = a[5] * e, c[6] = a[6] * e, c[7] = a[7] * e, c[8] = a[8] * b, c[9] = a[9] * b, c[10] = a[10] * b, c[11] = a[11] * b, c[12] = a[12], c[13] = a[13], c[14] = a[14], c[15] = a[15];
  return c
}, mat4.rotate = function (a, b, c, d) {
  var e = c[0],
    f = c[1];
  c = c[2];
  var g = Math.sqrt(e * e + f * f + c * c);
  if (!g) return null;
  g != 1 && (g = 1 / g, e *= g, f *= g, c *= g);
  var h = Math.sin(b),
    i = Math.cos(b),
    j = 1 - i;
  b = a[0], g = a[1];
  var k = a[2],
    l = a[3],
    m = a[4],
    n = a[5],
    o = a[6],
    p = a[7],
    q = a[8],
    r = a[9],
    s = a[10],
    t = a[11],
    u = e * e * j + i,
    v = f * e * j + c * h,
    w = c * e * j - f * h,
    x = e * f * j - c * h,
    y = f * f * j + i,
    z = c * f * j + e * h,
    A = e * c * j + f * h;
  e = f * c * j - e * h, f = c * c * j + i, d ? a != d && (d[12] = a[12], d[13] = a[13], d[14] = a[14], d[15] = a[15]) : d = a, d[0] = b * u + m * v + q * w, d[1] = g * u + n * v + r * w, d[2] = k * u + o * v + s * w, d[3] = l * u + p * v + t * w, d[4] = b * x + m * y + q * z, d[5] = g * x + n * y + r * z, d[6] = k * x + o * y + s * z, d[7] = l * x + p * y + t * z, d[8] = b * A + m * e + q * f, d[9] = g * A + n * e + r * f, d[10] = k * A + o * e + s * f, d[11] = l * A + p * e + t * f;
  return d
}, mat4.rotateX = function (a, b, c) {
  var d = Math.sin(b);
  b = Math.cos(b);
  var e = a[4],
    f = a[5],
    g = a[6],
    h = a[7],
    i = a[8],
    j = a[9],
    k = a[10],
    l = a[11];
  c ? a != c && (c[0] = a[0], c[1] = a[1], c[2] = a[2], c[3] = a[3], c[12] = a[12], c[13] = a[13], c[14] = a[14], c[15] = a[15]) : c = a, c[4] = e * b + i * d, c[5] = f * b + j * d, c[6] = g * b + k * d, c[7] = h * b + l * d, c[8] = e * -d + i * b, c[9] = f * -d + j * b, c[10] = g * -d + k * b, c[11] = h * -d + l * b;
  return c
}, mat4.rotateY = function (a, b, c) {
  var d = Math.sin(b);
  b = Math.cos(b);
  var e = a[0],
    f = a[1],
    g = a[2],
    h = a[3],
    i = a[8],
    j = a[9],
    k = a[10],
    l = a[11];
  c ? a != c && (c[4] = a[4], c[5] = a[5], c[6] = a[6], c[7] = a[7], c[12] = a[12], c[13] = a[13], c[14] = a[14], c[15] = a[15]) : c = a, c[0] = e * b + i * -d, c[1] = f * b + j * -d, c[2] = g * b + k * -d, c[3] = h * b + l * -d, c[8] = e * d + i * b, c[9] = f * d + j * b, c[10] = g * d + k * b, c[11] = h * d + l * b;
  return c
}, mat4.rotateZ = function (a, b, c) {
  var d = Math.sin(b);
  b = Math.cos(b);
  var e = a[0],
    f = a[1],
    g = a[2],
    h = a[3],
    i = a[4],
    j = a[5],
    k = a[6],
    l = a[7];
  c ? a != c && (c[8] = a[8], c[9] = a[9], c[10] = a[10], c[11] = a[11], c[12] = a[12], c[13] = a[13], c[14] = a[14], c[15] = a[15]) : c = a, c[0] = e * b + i * d, c[1] = f * b + j * d, c[2] = g * b + k * d, c[3] = h * b + l * d, c[4] = e * -d + i * b, c[5] = f * -d + j * b, c[6] = g * -d + k * b, c[7] = h * -d + l * b;
  return c
}, mat4.frustum = function (a, b, c, d, e, f, g) {
  g || (g = mat4.create());
  var h = b - a,
    i = d - c,
    j = f - e;
  g[0] = e * 2 / h, g[1] = 0, g[2] = 0, g[3] = 0, g[4] = 0, g[5] = e * 2 / i, g[6] = 0, g[7] = 0, g[8] = (b + a) / h, g[9] = (d + c) / i, g[10] = -(f + e) / j, g[11] = -1, g[12] = 0, g[13] = 0, g[14] = -(f * e * 2) / j, g[15] = 0;
  return g
}, mat4.perspective = function (a, b, c, d, e) {
  a = c * Math.tan(a * Math.PI / 360), b = a * b;
  return mat4.frustum(-b, b, -a, a, c, d, e)
}, mat4.ortho = function (a, b, c, d, e, f, g) {
  g || (g = mat4.create());
  var h = b - a,
    i = d - c,
    j = f - e;
  g[0] = 2 / h, g[1] = 0, g[2] = 0, g[3] = 0, g[4] = 0, g[5] = 2 / i, g[6] = 0, g[7] = 0, g[8] = 0, g[9] = 0, g[10] = -2 / j, g[11] = 0, g[12] = -(a + b) / h, g[13] = -(d + c) / i, g[14] = -(f + e) / j, g[15] = 1;
  return g
}, mat4.lookAt = function (a, b, c, d) {
  d || (d = mat4.create());
  var e = a[0],
    f = a[1];
  a = a[2];
  var g = c[0],
    h = c[1],
    i = c[2];
  c = b[1];
  var j = b[2];
  if (e == b[0] && f == c && a == j) return mat4.identity(d);
  var k, l, m, n;
  c = e - b[0], j = f - b[1], b = a - b[2], n = 1 / Math.sqrt(c * c + j * j + b * b), c *= n, j *= n, b *= n, k = h * b - i * j, i = i * c - g * b, g = g * j - h * c, (n = Math.sqrt(k * k + i * i + g * g)) ? (n = 1 / n, k *= n, i *= n, g *= n) : g = i = k = 0, h = j * g - b * i, l = b * k - c * g, m = c * i - j * k, (n = Math.sqrt(h * h + l * l + m * m)) ? (n = 1 / n, h *= n, l *= n, m *= n) : m = l = h = 0, d[0] = k, d[1] = h, d[2] = c, d[3] = 0, d[4] = i, d[5] = l, d[6] = j, d[7] = 0, d[8] = g, d[9] = m, d[10] = b, d[11] = 0, d[12] = -(k * e + i * f + g * a), d[13] = -(h * e + l * f + m * a), d[14] = -(c * e + j * f + b * a), d[15] = 1;
  return d
}, mat4.str = function (a) {
  return "[" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + "]"
}, quat4 = {}, quat4.create = function (a) {
  var b = new glMatrixArrayType(4);
  a && (b[0] = a[0], b[1] = a[1], b[2] = a[2], b[3] = a[3]);
  return b
}, quat4.set = function (a, b) {
  b[0] = a[0], b[1] = a[1], b[2] = a[2], b[3] = a[3];
  return b
}, quat4.calculateW = function (a, b) {
  var c = a[0],
    d = a[1],
    e = a[2];
  if (!b || a == b) {
    a[3] = -Math.sqrt(Math.abs(1 - c * c - d * d - e * e));
    return a
  }
  b[0] = c, b[1] = d, b[2] = e, b[3] = -Math.sqrt(Math.abs(1 - c * c - d * d - e * e));
  return b
}, quat4.inverse = function (a, b) {
  if (!b || a == b) {
    a[0] *= 1, a[1] *= 1, a[2] *= 1;
    return a
  }
  b[0] = -a[0], b[1] = -a[1], b[2] = -a[2], b[3] = a[3];
  return b
}, quat4.length = function (a) {
  var b = a[0],
    c = a[1],
    d = a[2];
  a = a[3];
  return Math.sqrt(b * b + c * c + d * d + a * a)
}, quat4.normalize = function (a, b) {
  b || (b = a);
  var c = a[0],
    d = a[1],
    e = a[2],
    f = a[3],
    g = Math.sqrt(c * c + d * d + e * e + f * f);
  if (g == 0) {
    b[0] = 0, b[1] = 0, b[2] = 0, b[3] = 0;
    return b
  }
  g = 1 / g, b[0] = c * g, b[1] = d * g, b[2] = e * g, b[3] = f * g;
  return b
}, quat4.multiply = function (a, b, c) {
  c || (c = a);
  var d = a[0],
    e = a[1],
    f = a[2];
  a = a[3];
  var g = b[0],
    h = b[1],
    i = b[2];
  b = b[3], c[0] = d * b + a * g + e * i - f * h, c[1] = e * b + a * h + f * g - d * i, c[2] = f * b + a * i + d * h - e * g, c[3] = a * b - d * g - e * h - f * i;
  return c
}, quat4.multiplyVec3 = function (a, b, c) {
  c || (c = b);
  var d = b[0],
    e = b[1],
    f = b[2];
  b = a[0];
  var g = a[1],
    h = a[2];
  a = a[3];
  var i = a * d + g * f - h * e,
    j = a * e + h * d - b * f,
    k = a * f + b * e - g * d;
  d = -b * d - g * e - h * f, c[0] = i * a + d * -b + j * -h - k * -g, c[1] = j * a + d * -g + k * -b - i * -h, c[2] = k * a + d * -h + i * -g - j * -b;
  return c
}, quat4.toMat3 = function (a, b) {
  b || (b = mat3.create());
  var c = a[0],
    d = a[1],
    e = a[2],
    f = a[3],
    g = c + c,
    h = d + d,
    i = e + e,
    j = c * g,
    k = c * h;
  c = c * i;
  var l = d * h;
  d = d * i, e = e * i, g = f * g, h = f * h, f = f * i, b[0] = 1 - (l + e), b[1] = k - f, b[2] = c + h, b[3] = k + f, b[4] = 1 - (j + e), b[5] = d - g, b[6] = c - h, b[7] = d + g, b[8] = 1 - (j + l);
  return b
}, quat4.toMat4 = function (a, b) {
  b || (b = mat4.create());
  var c = a[0],
    d = a[1],
    e = a[2],
    f = a[3],
    g = c + c,
    h = d + d,
    i = e + e,
    j = c * g,
    k = c * h;
  c = c * i;
  var l = d * h;
  d = d * i, e = e * i, g = f * g, h = f * h, f = f * i, b[0] = 1 - (l + e), b[1] = k - f, b[2] = c + h, b[3] = 0, b[4] = k + f, b[5] = 1 - (j + e), b[6] = d - g, b[7] = 0, b[8] = c - h, b[9] = d + g, b[10] = 1 - (j + l), b[11] = 0, b[12] = 0, b[13] = 0, b[14] = 0, b[15] = 1;
  return b
}, quat4.slerp = function (a, b, c, d) {
  d || (d = a);
  var e = c;
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3] < 0 && (e = -1 * c), d[0] = 1 - c * a[0] + e * b[0], d[1] = 1 - c * a[1] + e * b[1], d[2] = 1 - c * a[2] + e * b[2], d[3] = 1 - c * a[3] + e * b[3];
  return d
}, quat4.str = function (a) {
  return "[" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + "]"
}