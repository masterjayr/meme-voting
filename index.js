const contractSource = `
  payable contract MemeVote =
    record meme =
      { creatorAddress : address,
        url            : string,
        name           : string,
        voteCount      : int }
    record state =
      { memes      : map(int, meme),
        memesLength : int }
    entrypoint init() =
      { memes = {},
        memesLength = 0 }
    entrypoint getMeme(index : int) : meme =
      switch(Map.lookup(index, state.memes))
        None    => abort("There was no meme with this index registered.")
        Some(x) => x
    stateful entrypoint registerMeme(url' : string, name' : string) =
      let meme = { creatorAddress = Call.caller, url = url', name = name', voteCount = 0}
      let index = getMemesLength() + 1
      put(state{ memes[index] = meme, memesLength = index })
    entrypoint getMemesLength() : int =
      state.memesLength
    payable stateful entrypoint voteMeme(index : int) =
      let meme = getMeme(index)
      Chain.spend(meme.creatorAddress, Call.value)
      let updatedVoteCount = meme.voteCount + Call.value
      let updatedMemes = state.memes{ [index].voteCount = updatedVoteCount }
      put(state{ memes = updatedMemes })
`;
const contractAddress = 'ct_2fBQgEgw9Gj22qiY8Yz1RKMNdgwovXXbozDYwgGcksaBiVdHaR';
var memeArray = [];
var memesLength = 0;
var client = null;

function renderMemes() {
    memeArray = memeArray.sort(function (a, b) { return b.votes - a.votes });
    var template = $('#template').html();
    Mustache.parse(template);
    var rendered = Mustache.render(template, { memeArray });
    $('#memeBody').html(rendered);
}

async function callStatic(func, args){
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  const calledGet = await contract.call(func, args, {callStatic: true}).catch(e=>console.error(e));
  console.log('calledGet', calledGet);
  const decodedGet = await calledGet.decode().catch(e=>console.error(e));
  console.log('decoded get', decodedGet);
  return decodedGet;
}

window.addEventListener('load', async () => {
    $('#loader').show();
    client = await Ae.Aepp();
    // memesLength = callStatic('getMemesLength', []);
    memesLength = 2;
    for(let i =1; i <=memesLength; i++){
      const meme = await callStatic('getMeme', [i]);
      console.log('meme at', [i], meme);
      memeArray.push({
        creatorName: meme.name,
        memeUrl: meme.url,
        index: i, 
        votes: meme.voteCount
      })
    }
    renderMemes();
    $('#loader').hide();
})

jQuery('#memeBody').on("click", ".voteBtn", async function (event) {
    const value = $(this).siblings('input').val();
    console.log('clicked');
    const dataIndex = event.target.id;
    const foundIndex = memeArray.findIndex(meme => meme.index == dataIndex);
    memeArray[foundIndex].votes += parseInt(value, 10)
    renderMemes();
});

$('#registerBtn').click(async function () {
    var name = ($('#regName').val()),
        url = ($('#regUrl').val());

    memeArray.push({
        creatorName: name,
        memeUrl: url,
        index: memeArray.length + 1,
        votes: 0
    })
    renderMemes();
});





