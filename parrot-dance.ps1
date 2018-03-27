<#
.SYNOPSIS
Makes a parrot dance on your shell.
.EXAMPLE
./parrot-dance.ps1
#>

$request = [System.Net.HttpWebRequest]::Create("http://parrot.live");
$response = $request.GetResponse();
$receiveStream = $response.GetResponseStream();
$readStream = [System.IO.StreamReader]::new($receiveStream);

[console]::TreatControlCAsInput = $true;
$initialForegroundColor = [Console]::ForegroundColor;
while ($line = $readStream.ReadLine()) {
  if ([Console]::KeyAvailable) {
    $key = [System.Console]::ReadKey($true)
    if (($key.modifiers -band [ConsoleModifiers]"control") -and ($key.key -eq "C"))
    {
      break;
    }
  }

  [Console]::WriteLine($line);
}

$readStream.Close();
$receiveStream.Close();
$request.Abort();
[console]::TreatControlCAsInput = $false;
[Console]::ForegroundColor = $initialForegroundColor;
