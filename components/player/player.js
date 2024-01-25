import WebAudioFontPlayer from 'webaudiofont'

class Player {
  constructor(instruments) {
    ;(this.instruments = instruments), (this.master = 0.05), (this.echoAmount = 0.5), this.initAudio()
  }
  componentWillUnmount() {
    this.stopPlayLoop()
  }
  contextTime() {
    return this.audioContext.currentTime
  }
  refreshCache() {
    if (this.instruments) {
      for (var i = 0; i < this.instruments.length; i++) {
        this.cacheInstrument(this.instruments[i])
      }
    }
  }
  initAudio() {
    console.log('initAudio M♩D♩Sounds')
    if (this.player) {
      if (this.audioContext) {
        this.player.cancelQueue(this.audioContext)
      }
    }
    var AudioContextFunc = window.AudioContext || window.webkitAudioContext
    this.audioContext = new AudioContextFunc()
    this.destination = this.audioContext.destination
    this.player = new WebAudioFontPlayer()
    this.equalizer = this.player.createChannel(this.audioContext)
    this.output = this.audioContext.createGain()
    this.echo = this.player.createReverberator(this.audioContext)
    this.echo.wet.gain.setTargetAtTime(this.echoAmount, 0, 0.0001)
    this.echo.output.connect(this.output)
    this.equalizer.output.connect(this.echo.input)
    this.output.connect(this.destination)
    this.volumesInstrument = []
    this.midiNotes = []
  }
  cacheInstrument(n) {
    var info = this.player.loader.instrumentInfo(n)
    if (window[info.variable]) {
      return
    }
    this.player.loader.startLoad(this.audioContext, info.url, info.variable)
    this.player.loader.waitLoad(function () {
      console.log('cached', n, info.title)
    })
  }
  startPlayLoop(beats, bpm, density, fromBeat) {
    this.stopPlayLoop()
    var wholeNoteDuration = (4 * 60) / bpm
    if (fromBeat < beats.length) {
      this.beatIndex = fromBeat
    } else {
      this.beatIndex = 0
    }
    this.playBeatAt(this.contextTime(), beats[this.beatIndex], bpm)
    var nextLoopTime = this.contextTime() + density * wholeNoteDuration
    var me = this
    this.loopIntervalID = setInterval(function () {
      if (me.contextTime() > nextLoopTime - density * wholeNoteDuration) {
        me.beatIndex++
        if (me.beatIndex >= beats.length) {
          me.beatIndex = 0
        }
        me.playBeatAt(nextLoopTime, beats[me.beatIndex], bpm)
        nextLoopTime = nextLoopTime + density * wholeNoteDuration
      }
    }, 22)
  }
  stopPlayLoop() {
    clearInterval(this.loopIntervalID)
    this.cancelQueue()
  }
  cancelQueue() {
    this.player.cancelQueue(this.audioContext)
  }
  playBeatAt(when, beat, bpm) {
    var chords = beat
    console.log(chords)
    var N = (4 * 60) / bpm
    for (var i = 0; i < chords.length; i++) {
      var chord = chords[i]
      var instrument = chord[0]
      var pitches = chord[1]
      var duration = chord[2]
      var kind = 0
      if (chord.length > 3) {
        kind = chord[3]
      }
      if (kind === 1) {
        this.playStrumDownAt(when, instrument, pitches, duration * N)
      } else {
        if (kind === 2) {
          this.playStrumUpAt(when, instrument, pitches, duration * N)
        } else {
          if (kind === 3) {
            this.playSnapAt(when, instrument, pitches, duration * N)
          } else {
            this.playChordAt(when, instrument, pitches, duration * N)
          }
        }
      }
    }
  }
  playChordAt(when, instrument, pitches, duration) {
    var info = this.player.loader.instrumentInfo(instrument)
    if (window[info.variable]) {
      this.player.queueChord(this.audioContext, this.equalizer.input, window[info.variable], when, pitches, duration, 1)
    } else {
      this.cacheInstrument(instrument)
    }
  }
  playStrumUpAt(when, instrument, pitches, duration) {
    var info = this.player.loader.instrumentInfo(instrument)
    if (window[info.variable]) {
      this.player.queueStrumUp(
        this.audioContext,
        this.equalizer.input,
        window[info.variable],
        when,
        pitches,
        duration,
        0.1,
      )
    } else {
      this.cacheInstrument(instrument)
    }
  }
  playStrumDownAt(when, instrument, pitches, duration) {
    var info = this.player.loader.instrumentInfo(instrument)
    if (window[info.variable]) {
      this.player.queueStrumDown(
        this.audioContext,
        this.equalizer.input,
        window[info.variable],
        when,
        pitches,
        duration,
        0.1,
      )
    } else {
      this.cacheInstrument(instrument)
    }
  }
  playSnapAt(when, instrument, pitches, duration) {
    var info = this.player.loader.instrumentInfo(instrument)
    if (window[info.variable]) {
      this.player.queueSnap(
        this.audioContext,
        this.equalizer.input,
        window[info.variable],
        when,
        pitches,
        duration,
        0.05,
      )
    } else {
      this.cacheInstrument(instrument)
    }
  }
  playChordNow(instrument, pitches, duration) {
    this.playChordAt(0, instrument, pitches, duration)
  }
  playStrumUpNow(instrument, pitches, duration) {
    this.playStrumUpAt(0, instrument, pitches, duration)
  }
  playStrumDownNow(instrument, pitches, duration) {
    this.playStrumDownAt(0, instrument, pitches, duration)
  }
  playSnapNow(instrument, pitches, duration) {
    this.playSnapAt(0, instrument, pitches, duration)
  }
  setMasterVolume(volume) {
    this.output.gain.setTargetAtTime(volume, 0, 0.0001)
    this.setState({
      master: volume,
    })
  }
  setInstrumentVolume(instrument, volume) {
    this.volumesInstrument[instrument] = volume
  }
  setKeyboardInstrument(n) {
    var info = this.player.loader.instrumentInfo(n)
    if (window[info.variable]) {
      this.miditone = window[info.variable]
      return
    }
    this.player.loader.startLoad(this.audioContext, info.url, info.variable)
    this.player.loader.waitLoad(function () {
      console.log('cached', n, info.title)
      this.miditone = window[info.variable]
    })
  }
}

export default Player