import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Message } from 'semantic-ui-react';
import { get } from 'core/client/services/core.api.services';


class RemoteAmp extends Component {

  constructor() {
    super();

    this.handlerSendCommand = this.handlerSendCommand.bind(this);
    this.handlerMouseDown = this.handlerMouseDown.bind(this);
    this.handlerMouseUp = this.handlerMouseUp.bind(this);

    this.interval = null;
    this.speed = 500;

    this.state = {
      error: false,
      msg: '',
    };
  }

  handlerMouseDown(e, opt) {
    this.interval = setInterval( (e) => this.handlerSendCommand( e, opt ), this.speed);
  }

  handlerMouseUp() {
    clearInterval(this.interval);
  }

  handlerSendCommand( e, opt ) {
    const _self = this;
    this.props.sendCommand( opt )
      .then( data => {
        if (!data.success){
          console.log(data.msg);
          _self.setState(
            {
              error: true,
              msg: data.msg
            });
          }
        }
      )
    ;
  }


  render(){

    const { error, msg } = this.state;

      return (
        <div>
          <h1>Remote Amp</h1>

          <Message negative hidden={!error}>
            <Message.Header>{msg}</Message.Header>
          </Message>

          <section>
            <Button type='button' onClick={(e) => this.handlerSendCommand(e, 'KEY_POWER')} content='On' color='blue'/>
            <Button type='button' onClick={(e) => this.handlerSendCommand(e, 'off')} content='Off' color='red'/>

            <Button type='button' onClick={(e) => this.handlerSendCommand(e, 'KEY_AUX')} content='Rasp' color='green'/>

            <Button type='button' onMouseDown={(e) => this.handlerMouseDown(e, 'KEY_VOLUMEUP')} onMouseUp={this.handlerMouseUp} content='Volume +' color='blue'/>
            <Button type='button' onMouseDown={(e) => this.handlerMouseDown(e, 'KEY_VOLUMEDOWN')} onMouseUp={this.handlerMouseUp} content='Volume -' color='blue'/>
            <Button type='button' onMouseDown={(e) => this.handlerMouseDown(e, 'KEY_MUTE')} onMouseUp={this.handlerMouseUp} content='Mute' color='blue'/>
          </section>
        </div>
      );
  }

}

const mapDispatchToProps = ( dispatch ) => {
  return {
    sendCommand: (opt) => {
      return dispatch(
        get( 'remoteAmp/' + opt )
      )
    },
  }
};

const RemoteAmpContainer = connect(
  null,
  mapDispatchToProps,
)(RemoteAmp);

export default RemoteAmpContainer