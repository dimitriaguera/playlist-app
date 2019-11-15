exports.normalizedMeta = function(node) {
  const nMeta = Object.assign({}, node.meta);
  nMeta.artist = nMeta.artist ? nMeta.artist.toLowerCase() : '';
  nMeta.albumartist = nMeta.albumartist ? nMeta.albumartist.toLowerCase() : '';
  nMeta.album = nMeta.album ? nMeta.album.toLowerCase() : '';
  nMeta.title = nMeta.title ? nMeta.title : node.publicName;
  return nMeta;
};

exports.getAlbumKeyFromTrackNodeMeta = function(ps, meta) {
  let artistKEY = meta.albumartist || meta.artist;
  return ps.buildSeparator([artistKEY, meta.album, meta.diskno], '___');
};
