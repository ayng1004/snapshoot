#!/bin/sh
# wait-for-it.sh

set -e

host="$1"
port="$2"
shift 2
cmd="$@"

until nc -z "$host" "$port" 2>/dev/null || [ $? -eq 0 ]; do
  >&2 echo "En attente de $host:$port..."
  sleep 3
done

>&2 echo "$host:$port est disponible"
exec $cmd