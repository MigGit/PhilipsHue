1..254 | ForEach-Object {
    $ip = "192.168.1.$_"
    if (Test-Connection $ip -Count 1 -Quiet) {
        try {
            $name = [System.Net.Dns]::GetHostEntry($ip).HostName
        } catch {
            $name = "Sin nombre"
        }

        [PSCustomObject]@{
            IP = $ip
            Nombre = $name
        }
    }
}