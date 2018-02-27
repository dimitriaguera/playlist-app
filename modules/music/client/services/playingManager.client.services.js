exports.getIndexQueue = function( po, queue ) {

};

exports.testIndexQueue = function( state, action ) {
  if( action.indexQueue === 0 ) return 0;
  if( action.indexQueue ) return action.indexQueue;
  if( state.indexQueue === 0 ) return 0;
  if( state.indexQueue ) return state.indexQueue;
  console.error('playingManagerStore : error need indexQueue from action or state to update playableObject in queue.')
}