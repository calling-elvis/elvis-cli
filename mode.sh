readonly path='\.\./\.\./\.\./elvis/web/pkg';

case $# in
    0)
	cd ./packages/calling-elvis
	sed -i '.bak' "s/elvis-web/${path}/g" **/*
	rm *.bak
	echo '[dev]: convert to calling-elvis development mode'
	;;
    *)
	cd ./packages/calling-elvis
	sed -i '.bak' "s/${path}/elvis-web/g" **/*
	rm *.bak
	echo '[npm]: convert calling-elvis to npm mode'
	;;
esac
