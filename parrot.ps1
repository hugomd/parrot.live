# a quick powershell one-liner so our windows friends can also enjoy terminal parrots!
# Invoke-WebRequest and Invoke-RestMethod expect the stream to end and don't currently 
# support displaying anything prior to that.
$urlstring="https://raw.githubusercontent.com/hugomd/parrot.live/master/frames/"; while (1) {foreach ($i in 1..9) {[Console]::ForegroundColor = [System.ConsoleColor](Get-Random -Min 0 -Max ([System.ConsoleColor].GetFields().Count - 1)); (Invoke-WebRequest $($urlstring+$i+".txt")).content; start-sleep -milliseconds 70}}
